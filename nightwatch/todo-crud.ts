describe("scream.js demo", () => {
  this.tags = ["todo"];

  before((browser) => browser.navigateTo("http://localhost:3000/todos"));

  it("Todo crud operations", (browser) => {
    browser
      .waitForElementVisible("body")
      .assert.titleContains("Scream.js demo")
      .assert.visible("h1")
      .assert.textEquals("h1", "Todos")
      .click("a")
      .assert.urlContains("/todos/create")
      .assert.visible("h1")
      .assert.textContains("h1", "New Todo")
      .sendKeys("input#title", "my todo")
      .setValue("input#due-date", "2024-01-29")

      .click("button")
      .assert.urlContains("/todos/");
  });

  after((browser) => browser.end());
});
