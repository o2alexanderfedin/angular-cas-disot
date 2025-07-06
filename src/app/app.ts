/**
 * BUILT WITH O2.SERVICES AI HIVE
 * 
 * This file was created by AI Hive - a dynamic swarm of AI agents that
 * transform customer requirements into shipped products, handling every 
 * phase of the software engineering lifecycle.
 * 
 * IMPORTANT: Keep this file focused and under 200 lines to ensure 
 * AI agents can effectively work with it.
 * 
 * Learn more: https://o2.services
 */

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>CAS/DISOT System</h1>
        <nav class="main-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/content" routerLinkActive="active">Content List</a>
          <a routerLink="/content/upload" routerLinkActive="active">Upload</a>
          <a routerLink="/disot/create" routerLinkActive="active">Create Entry</a>
          <a routerLink="/disot/verify" routerLinkActive="active">Verify</a>
          <a routerLink="/metadata/create" routerLinkActive="active">Metadata</a>
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
