// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./AuthForm";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  replace: vi.fn(),
  loading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    status: "unauthenticated",
    login: mocks.login,
    register: mocks.register,
    loading: mocks.loading,
    error: null,
  }),
}));

describe("AuthForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.login.mockReset().mockResolvedValue(undefined);
    mocks.register.mockReset().mockResolvedValue(undefined);
    mocks.replace.mockReset();
    mocks.loading = false;
  });

  it("submits login credentials when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Пароль"), "password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(mocks.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password",
    });
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/plots");
  });

  it("submits registration credentials when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Пароль"), "secure-password");
    await user.type(screen.getByLabelText("Повторите пароль"), "secure-password");
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(mocks.register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secure-password",
    });
    expect(mocks.login).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/plots");
  });

  it("does not submit invalid registration data", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Email"), "invalid-email");
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(mocks.register).not.toHaveBeenCalled();
    expect(await screen.findByText("Введите корректный email")).toBeInTheDocument();
  });

  it("disables submission while authentication is pending", () => {
    mocks.loading = true;
    render(<AuthForm mode="login" />);

    expect(screen.getByRole("button", { name: "Войти" })).toBeDisabled();
  });
});
