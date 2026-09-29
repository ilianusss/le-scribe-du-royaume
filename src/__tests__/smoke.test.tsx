import Accueil from '@/app/index';

test('home screen module loads through the jest-expo preset', () => {
  expect(typeof Accueil).toBe('function');
});
