import { groupBy, isSubtag } from './utils.js';

test('groupBy', () => {
  expect(
    groupBy('a', [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      { a: 2, b: 4 },
      { a: 1, b: 5 },
      { a: 3, b: 6 },
    ]),
  ).toEqual({
    1: [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
      { a: 1, b: 5 },
    ],
    2: [
      { a: 2, b: 3 },
      { a: 2, b: 4 },
    ],
    3: [{ a: 3, b: 6 }],
  });
});

test('isSubtag', () => {
  expect(isSubtag('a', 'a')).toBeTruthy();
  expect(isSubtag('a/b', 'a')).toBeTruthy();
  expect(isSubtag('a/b', 'b')).toBeFalsy();
});
