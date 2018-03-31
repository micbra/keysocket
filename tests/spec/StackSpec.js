import Stack from "/extension/modules/stack.js";

describe("Stack", function() {
  var stack;

  beforeEach(function() {
    stack = new Stack();
  });

  it("should be initially empty", function() {
    expect(stack.stack).toBeEmpty();
  });

  it("should be pushable", function() {
    stack.push(1);
    expect(stack.stack).toEqual([1]);

    stack.push(2);
    expect(stack.stack).toEqual([1, 2]);
  });

  it("should be popable", function() {
    stack.push(1);
    stack.push(2);

    expect(stack.pop()).toEqual(2);
    expect(stack.stack).toEqual([1]);

    expect(stack.pop()).toEqual(1);
    expect(stack.stack).toEqual([]);

    expect(stack.pop()).toBe(undefined);
  });

  it("should be pushable on top", function() {
    stack.push(1);
    stack.push(2);

    stack.pushOnTop(3);
    expect(stack.stack).toEqual([1, 2, 3]);

    stack.pushOnTop(1);
    expect(stack.stack).toEqual([2, 3, 1]);
  });

  it("should be able to remove element", function() {
    stack.remove(1);

    stack.push(1);
    stack.push(2);

    stack.remove(1);
    expect(stack.stack).toEqual([2]);

    stack.remove(2);
    expect(stack.stack).toEqual([]);
  });


  it("should be tell if it has an element", function() {
    expect(stack.has(1)).toBeFalsy();

    stack.push(1);
    expect(stack.has(1)).toBeTruthy();
    expect(stack.has(2)).toBeFalsy();

    stack.push(2);
    expect(stack.has(1)).toBeTruthy();
    expect(stack.has(2)).toBeTruthy();
    expect(stack.has(3)).toBeFalsy();

    stack.pop();
    expect(stack.has(1)).toBeTruthy();
    expect(stack.has(2)).toBeFalsy();

    stack.pop();
    expect(stack.has(1)).toBeFalsy();
  });
});