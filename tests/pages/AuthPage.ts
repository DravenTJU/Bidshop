import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goToRegister() {
    await this.page.goto('/register');
  }

  async goToLogin() {
    await this.page.goto('/login');
  }

  async register(name: string, email: string, password: string) {
    await this.page.getByTestId('register-name').fill(name);
    await this.page.getByTestId('register-email').fill(email);
    await this.page.getByTestId('register-password').fill(password);
    await this.page.getByTestId('register-submit').click();
  }

  async login(email: string, password: string) {
    await this.page.getByTestId('login-email').fill(email);
    await this.page.getByTestId('login-password').fill(password);
    await this.page.getByTestId('login-submit').click();
  }

  get registerError() {
    return this.page.getByTestId('register-error');
  }

  get loginError() {
    return this.page.getByTestId('login-error');
  }
}
