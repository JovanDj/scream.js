import { ScreamView } from "../scream-view";

xdescribe("ScremView", () => {
  let view: ScreamView;

  beforeEach(() => {
    view = new ScreamView();
  });

  it("should be defined", () => {
    expect(view).toBeDefined();
  });

  it("should render template", () => {
    const template = "<p>${name}</p>";
    const data: { name: string } = { name: "Jovan" };
    const expected = "<p>Jovan</p>";

    expect(view.renderHTML<{ name: string }>(template, data)).toEqual(expected);
  });
});
