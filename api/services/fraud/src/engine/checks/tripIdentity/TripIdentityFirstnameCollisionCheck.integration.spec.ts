import { tripIdentityCheckMacro } from './tripIdentityCheckMacro';
import { ServiceProvider } from '../../../ServiceProvider';
import { TripIdentityFirstnameCollisionCheck } from './TripIdentityFirstnameCollisionCheck';

const { test, range } = tripIdentityCheckMacro(ServiceProvider, TripIdentityFirstnameCollisionCheck);

test('max', range, [{ firstname: 'Léon' }, { firstname: 'Léon' }], 1, 1);
test('min', range, [{ firstname: 'Léon' }, { firstname: 'Maxime' }], 0, 0);
test('between', range, [{ firstname: 'Léon' }, { firstname: 'Léon' }, { firstname: 'Maxime' }], 0.6, 0.7);
