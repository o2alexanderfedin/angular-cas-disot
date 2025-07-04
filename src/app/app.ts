import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>CAS - Content Addressable Storage</h1>
        <nav class="main-nav">
          <a routerLink="/content" routerLinkActive="active">Content List</a>
          <a routerLink="/upload" routerLinkActive="active">Upload</a>
          <a routerLink="/disot/create" routerLinkActive="active">Create Entry</a>
          <a routerLink="/disot/verify" routerLinkActive="active">Verify</a>
          <a routerLink="/settings" routerLinkActive="active">Settings</a>
        </nav>
      </header>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="app-footer">
        <p>Decentralized Content Management System</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-header h1 {
      margin: 0 0 15px 0;
      font-size: 24px;
    }

    .main-nav {
      display: flex;
      gap: 20px;
    }

    .main-nav a {
      color: #ecf0f1;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .main-nav a:hover {
      background-color: #34495e;
    }

    .main-nav a.active {
      background-color: #3498db;
    }

    .main-content {
      flex: 1;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .app-footer {
      background-color: #2c3e50;
      color: #ecf0f1;
      text-align: center;
      padding: 20px;
    }

    .app-footer p {
      margin: 0;
    }
  `]
})
export class App {
  protected title = 'cas-app';
}
