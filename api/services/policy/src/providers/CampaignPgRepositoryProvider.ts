import { provider, NotFoundException } from '@ilos/common';
import { PostgresConnection } from '@ilos/connection-postgres';

import { CampaignInterface } from '../shared/policy/common/interfaces/CampaignInterface';
import {
  CampaignRepositoryProviderInterface,
  CampaignRepositoryProviderInterfaceResolver,
} from '../interfaces/CampaignRepositoryProviderInterface';

@provider({
  identifier: CampaignRepositoryProviderInterfaceResolver,
})
export class CampaignPgRepositoryProvider implements CampaignRepositoryProviderInterface {
  public readonly table = 'policy.policies';

  constructor(protected connection: PostgresConnection) {}

  async find(id: number): Promise<CampaignInterface> {
    const query = {
      text: `
        SELECT * FROM ${this.table}
        WHERE _id = $1
        AND deleted_at IS NULL
        LIMIT 1
      `,
      values: [id],
    };

    const result = await this.connection.getClient().query(query);

    if (result.rowCount === 0) {
      return undefined;
    }

    return result.rows[0];
  }

  async create(data: CampaignInterface): Promise<CampaignInterface> {
    const query = {
      text: `
        INSERT INTO ${this.table} (
          parent_id,
          territory_id,
          start_date,
          end_date,
          name,
          description,
          unit,
          status,
          global_rules,
          rules,
          ui_status
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        RETURNING *
      `,
      values: [
        'parent_id' in data ? data.parent_id : null,
        data.territory_id,
        data.start_date,
        data.end_date,
        data.name,
        'description' in data ? data.description : null,
        data.unit,
        data.status,
        JSON.stringify(data.global_rules),
        JSON.stringify(data.rules),
        JSON.stringify('ui_status' in data ? data.ui_status : {}),
      ],
    };

    const result = await this.connection.getClient().query(query);
    if (result.rowCount !== 1) {
      throw new Error(`Unable to create campaign (${JSON.stringify(data)})`);
    }

    return result.rows[0];
  }

  async patch(id: number, patch: Partial<CampaignInterface>): Promise<CampaignInterface> {
    const updatablefields = [
      'ui_status',
      'name',
      'description',
      'start_date',
      'end_date',
      'unit',
      'global_rules',
      'rules',
      'status',
    ].filter((k) => Object.keys(patch).indexOf(k) >= 0);

    const sets = {
      text: ['updated_at = NOW()'],
      values: [],
    };

    for (const fieldName of updatablefields) {
      sets.text.push(`${fieldName} = $#`);
      sets.values.push(
        ['global_rules', 'rules'].indexOf(fieldName) >= 0 ? JSON.stringify(patch[fieldName]) : patch[fieldName],
      );
    }

    const query = {
      text: `
      UPDATE ${this.table}
        SET ${sets.text.join(',')}
        WHERE _id = $#
        AND deleted_at IS NULL
        RETURNING *
      `,
      values: [...sets.values, id],
    };

    query.text = query.text.split('$#').reduce((acc, current, idx, origin) => {
      if (idx === origin.length - 1) {
        return `${acc}${current}`;
      }

      return `${acc}${current}$${idx + 1}`;
    }, '');

    const result = await this.connection.getClient().query(query);
    if (result.rowCount !== 1) {
      throw new NotFoundException(`campaign not found (${id})`);
    }

    return result.rows[0];
  }

  async deleteDraftOrTemplate(id: number): Promise<void> {
    const query = {
      text: `
      UPDATE ${this.table}
        SET deleted_at = NOW()
        WHERE _id = $1 AND status::text = ANY ($2::text[]) AND deleted_at IS NULL
      `,
      values: [id, ['draft', 'template']],
    };

    const result = await this.connection.getClient().query(query);

    if (result.rowCount !== 1) {
      throw new NotFoundException(`Campaign not found (${id})`);
    }

    return;
  }

  async patchWhereTerritory(
    id: number,
    territoryId: number,
    patch: Partial<CampaignInterface>,
  ): Promise<CampaignInterface> {
    const updatablefields = [
      'ui_status',
      'name',
      'description',
      'start_date',
      'end_date',
      'unit',
      'global_rules',
      'rules',
    ].filter((k) => Object.keys(patch).indexOf(k) >= 0);

    const sets = {
      text: ['updated_at = NOW()'],
      values: [],
    };

    for (const fieldName of updatablefields) {
      sets.text.push(`${fieldName} = $#`);
      sets.values.push(
        ['global_rules', 'rules'].indexOf(fieldName) >= 0 ? JSON.stringify(patch[fieldName]) : patch[fieldName],
      );
    }

    const query = {
      text: `
      UPDATE ${this.table}
        SET ${sets.text.join(',')}
        WHERE _id = $#
        AND territory_id = $#
        AND deleted_at IS NULL
        RETURNING *
      `,
      values: [...sets.values, id, territoryId],
    };

    query.text = query.text.split('$#').reduce((acc, current, idx, origin) => {
      if (idx === origin.length - 1) {
        return `${acc}${current}`;
      }

      return `${acc}${current}$${idx + 1}`;
    }, '');

    const result = await this.connection.getClient().query(query);
    if (result.rowCount !== 1) {
      throw new NotFoundException(`campaign not found (${id})`);
    }

    return result.rows[0];
  }

  async findOneWhereTerritory(id: number, territoryId: number): Promise<CampaignInterface | null> {
    const query = {
      text: `
        SELECT * FROM ${this.table}
        WHERE _id = $1::int
        AND territory_id = $2::int
        AND deleted_at IS NULL
        LIMIT 1
      `,
      values: [id, territoryId],
    };

    const result = await this.connection.getClient().query(query);

    return result.rowCount ? result.rows[0] : null;
  }

  async findWhere(search: {
    _id?: number;
    territory_id?: number | null | number[];
    status?: string;
    datetime?: Date;
    ends_in_the_future?: boolean;
  }): Promise<CampaignInterface[]> {
    const values = [];
    const whereClauses = ['deleted_at IS NULL'];
    for (const key of Reflect.ownKeys(search)) {
      switch (key) {
        case '_id':
          values.push(search[key]);
          whereClauses.push(`_id = $${values.length}`);
          break;
        case 'status':
          values.push(search[key]);
          whereClauses.push(`status::text = $${values.length}`);
          break;
        case 'territory_id':
          const tid = search[key];
          if (tid === null) {
            whereClauses.push('territory_id IS NULL');
          } else if (Array.isArray(tid)) {
            values.push(tid);
            whereClauses.push(`territory_id = ANY($${values.length}::int[])`);
          } else {
            values.push(tid);
            whereClauses.push(`territory_id = $${values.length}::int`);
          }
          break;
        case 'datetime':
          values.push(search[key]);
          whereClauses.push(`start_date <= $${values.length}::timestamp AND end_date >= $${values.length}::timestamp`);
          break;
        case 'ends_in_the_future':
          whereClauses.push(`end_date ${search[key] ? '>' : '<'} NOW()`);
          break;
        default:
          break;
      }
    }
    const query = {
      values,
      text: `
        SELECT * FROM ${this.table}
        WHERE ${whereClauses.join(' AND ')}
      `,
    };

    const result = await this.connection.getClient().query(query);

    if (result.rowCount === 0) {
      return [];
    }

    return result.rows;
  }

  async getTemplates(): Promise<CampaignInterface[]> {
    const result = await this.connection.getClient().query(`
      SELECT * FROM ${this.table} WHERE status = 'template' AND deleted_at IS NULL ORDER BY slug
    `);

    return result.rows;
  }
}
