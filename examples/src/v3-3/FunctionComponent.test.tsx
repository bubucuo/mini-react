import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { FunctionComponent } from "./FunctionComponent";

describe("snapshots", () => {
  it("renders correctly", () => {
    const { container } = render(<FunctionComponent />);
    expect(container).toMatchSnapshot();
  });
});

describe("Interactive Testing", () => {
  it("renders correctly and increases count on click", () => {
    render(<FunctionComponent />);

    // 初始值是 0
    const button = screen.getByRole("button", { name: "0" });
    expect(button).toBeInTheDocument();

    // 点击后变为 1
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();

    // 再点击后变为 2
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  });
});
