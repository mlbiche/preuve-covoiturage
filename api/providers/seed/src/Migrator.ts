import { createDatabase, dropDatabase, migrate } from '@pdc/migrator';
import { PostgresConnection } from '@ilos/connection-postgres';
import { URL } from 'url';

import { Operator, operators } from './operators';
import { Territory, territories } from './territories';
import { User, users } from './users';

export class Migrator {
  public connection: PostgresConnection;
  public config: {
    driver: string;
    user: string;
    password: string;
    host: string;
    database: string;
    port: number;
    ssl: boolean;
  };
  public readonly dbName: string;
  public readonly dbIsCreated: boolean;

  constructor(dbUrlString: string, newDatabase = true) {
    const dbUrl = new URL(dbUrlString);
    this.config = {
      driver: 'pg',
      user: dbUrl.username,
      password: dbUrl.password,
      host: dbUrl.hostname,
      database: dbUrl.pathname.replace('/', ''),
      port: parseInt(dbUrl.port),
      ssl: false,
    };
    this.dbIsCreated = newDatabase;
    this.dbName = newDatabase ? `test-${Date.now().valueOf()}` : dbUrl.pathname.replace('/', '');
  }

  async up() {
    this.connection = new PostgresConnection({
      ...this.config,
      database: this.dbName,
    });
    await this.connection.up();
  }

  async create() {
    if (this.dbIsCreated) {
      await createDatabase(this.config, this.dbName);
    }
  }

  async migrate() {
    await migrate({
      ...this.config,
      database: this.dbName,
    });
  }

  async seed() {
    if (!this.connection) {
      await this.up();
    }
    await this.connection.getClient().query(`SET session_replication_role = 'replica'`);

    for (const territory of territories) {
      console.debug(`Seeding territory ${territory.name}`);
      await this.seedTerritory(territory);
    }

    for (const operator of operators) {
      console.debug(`Seeding operator ${operator.name}`);
      await this.seedOperator(operator);
    }

    for (const user of users) {
      console.debug(`Seeding user ${user.email}`);
      await this.seedUser(user);
    }

    /*
          - Territoires
            - company.companies

          - Operateurs
            - operator.operators
            - operator.thumbnails
            - application.applications
            - company.companies
            - territory.territory_operators

          - Politiques
            - policy.policies

          - Trajets
            - acquisition.acquisitions
            - carpool.carpools
            - carpool.identities

          - Liste des tables
            - certificates.**
            - honor.tracking
            - fraudcheck.fraudchecks
            - policy.policy_metas
            - policy.incentives
            +++ VIEWS +++ 
    */
    await this.connection.getClient().query(`SET session_replication_role = 'origin'`);
  }

  async seedOperator(operator: Operator) {
    await this.connection.getClient().query({
      text: `
        INSERT INTO operator.operators
          (_id, name, legal_name, siret, company, address, bank, contacts)
        VALUES (
          $1::int,
          $2::varchar,
          $3::varchar,
          $4::varchar,
          $5::json,
          $6::json,
          $7::json,
          $8::json
        )
        ON CONFLICT DO NOTHING
      `,
      values: [
        operator._id,
        operator.name,
        operator.legal_name,
        operator.siret,
        operator.company,
        operator.address,
        operator.bank,
        operator.contacts,
      ],
    });
  }

  async seedUser(user: User) {
    await this.connection.getClient().query({
      text: `
        INSERT INTO auth.users
          (email, firstname, lastname, password, status, role, territory_id, operator_id)
        VALUES (
          $1::varchar,
          $2::varchar,
          $3::varchar,
          $4::varchar,
          $5::auth.user_status_enum,
          $6::varchar,
          $7::int,
          $8::int
        )
        ON CONFLICT DO NOTHING 
      `,
      values: [
        user.email,
        user.firstname,
        user.lastname,
        user.password, // TODO: use cryptoprovider tcrypt password
        user.status,
        user.role,
        user.territory?._id,
        user.operator?._id,
      ],
    });
  }

  async seedTerritory(territory: Territory) {
    await this.connection.getClient().query({
      text: `
        INSERT INTO territory.territories
          (_id, name, level, geo, population, surface)
        VALUES
          (
            $1::int, 
            $2::varchar, 
            $3::territory.territory_level_enum, 
            ST_GeomFromGeoJSON($4::json),
            $5::int,
            $6::int
          )
        ON CONFLICT DO NOTHING
      `,
      values: [territory._id, territory.name, territory.level, territory.geo, territory.population, territory.surface],
    });

    await this.connection.getClient().query(`
    SELECT setval('territory.territories__id_seq1', (SELECT MAX(_id) FROM territory.territories)+1);
    `);

    if (territory.insee) {
      const postcodes = territory.postcodes || [];
      await this.connection.getClient().query({
        text: `
            INSERT INTO territory.territory_codes
              (territory_id, type, value)
            SELECT * FROM UNNEST($1::int[], $2::varchar[], $3::varchar[])
            ON CONFLICT
            DO NOTHING 
          `,
        values: [
          ...[
            { territory_id: territory._id, type: 'insee', value: territory.insee },
            ...postcodes.map((c) => ({ territory_id: territory._id, type: 'postcode', value: c })),
          ].reduce(
            (acc, c) => {
              const [tid, ct, cv] = acc;
              tid.push(c.territory_id);
              ct.push(c.type);
              cv.push(c.value);
              return [tid, ct, cv];
            },
            [[], [], []],
          ),
        ],
      });
    }

    if (territory.children && territory.children.length) {
      await this.connection.getClient().query({
        text: `
            INSERT INTO territory.territory_relation 
              (parent_territory_id, child_territory_id)
            SELECT * FROM UNNEST($1::int[], $2::int[])
            ON CONFLICT DO NOTHING
          `,
        values: [
          ...territory.children
            .map((c) => ({ parent: territory._id, child: c._id }))
            .reduce(
              (acc, r) => {
                const [parent, child] = acc;
                parent.push(r.parent);
                child.push(r.child);
                return [parent, child];
              },
              [[], []],
            ),
        ],
      });
    }
  }

  async down() {
    if (this.connection) {
      await this.connection.down();
    }
  }

  async drop() {
    if (this.dbIsCreated) {
      await dropDatabase(this.config, this.dbName);
    }
  }
}
