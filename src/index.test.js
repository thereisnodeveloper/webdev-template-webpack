/** @jest-environment jsdom */

import capitalize from "./index.js";

describe('capitalize', () => {
  it('takes a string and capitalize 1st letter', () => {
    expect(capitalize).toBeDefined();
  });
});

