beforeEach(function () {
  jasmine.addMatchers({
    toBeEmpty: function () {
      return {
        compare: function (actual) {
          return {
            pass: actual.length < 1
          };
        }
      };
    }
  });
});