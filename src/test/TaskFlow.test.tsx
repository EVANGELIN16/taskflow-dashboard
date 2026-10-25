
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function WelcomeMessage() {
  return <h1>Welcome to TaskFlow</h1>;
}

describe("TaskFlow welcome component", () => {
  it("displays the welcome heading", () => {
    render(<WelcomeMessage />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome to TaskFlow",
      }),
    ).toBeInTheDocument();
  });
});
