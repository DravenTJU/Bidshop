import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly registerForm: {
    name: Locator;
    email: Locator;
    password: Locator;
    submit: Locator;
    error: Locator;
  };
  readonly loginForm: {
    email: Locator;
    password: Locator;
    submit: Locator;
    error: Locator;
  };

  constructor(page: Page) {
    super(page);
    this.registerForm = {
      name:     page.getByTestId('register-name'),
      email:    page.getByTestId('register-email'),
      password: page.getByTestId('register-password'),
      submit:   page.getByTestId('register-submit'),
      error:    page.getByTestId('register-error'),
    };
    this.loginForm = {
      email:    page.getByTestId('login-email'),
      password: page.getByTestId('login-password'),
      submit:   page.getByTestId('login-submit'),
      error:    page.getByTestId('login-error'),
    };
  }

  async goToRegister() { await this.page.goto('/register'); }
  async goToLogin()    { await this.page.goto('/login'); }

  async register(name: string, email: string, password: string) {
    await this.registerForm.name.fill(name);
    await this.registerForm.email.fill(email);
    await this.registerForm.password.fill(password);
    await this.registerForm.submit.click();
  }

  async login(email: string, password: string) {
    await this.loginForm.email.fill(email);
    await this.loginForm.password.fill(password);
    await this.loginForm.submit.click();
  }
}
