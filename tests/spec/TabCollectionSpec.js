import {TabCollection, TabProperties} from "/extension/modules/tab-collection.js";

describe("TabCollection", function() {
  var collection;

  beforeEach(function() {
    collection = new TabCollection();
  });

  it("should be initially empty", function() {
    collection.each(function () {
      fail("Not empty");
    });
    expect().nothing();
  });

  it("should support adding (creating) new TabProperties item by tabId", function() {
    collection.add(1);
    expect(collection.has(1)).toBeTruthy();
    expect(collection.get(1)).toEqual(new TabProperties(1));
  });

  it("should support removing item by tabId", function() {
    collection.add(1);
    expect(collection.has(1)).toBeTruthy();
    expect(collection.get(1)).toEqual(new TabProperties(1));
    collection.remove(1);
    expect(collection.has(1)).toBeFalsy();
    expect(collection.get(1)).toBe(undefined);
  });

  it("should support iteration via each method", function() {
    let sampleData = [[1], [1, 2, 3]];
    for (const sampleItem of sampleData) {
      let sample = [];
      for (const tabId of sampleItem) {
        sample.push({tabId: tabId, props: new TabProperties(tabId)});
        collection.add(tabId);
      }

      let actual = [];
      collection.each((tabId, tabProps) => actual.push({tabId: tabId, props: tabProps}));
      expect(actual).toEqual(sample);
    }
  });
});