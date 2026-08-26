import {render, screen} from "@testing-library/react";
import {CollapsibleList} from "./CollapsibleList";

test("renders conditional and text children without manufacturing an undefined element", () => {
    const {rerender} = render(
        <CollapsibleList title="Panel" borderColor="yellow">
            {"selected" && <div>Selected example</div>}
        </CollapsibleList>
    );
    expect(screen.getByText("Selected example")).toBeInTheDocument();

    expect(() => rerender(
        <CollapsibleList title="Panel" borderColor="yellow">
            {"" && <div>Selected example</div>}
        </CollapsibleList>
    )).not.toThrow();
    expect(screen.queryByText("Selected example")).not.toBeInTheDocument();
});
