import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsComponent } from './components/settings/settings.component';

@Component({
  selector: 'app-root',
  imports: [SettingsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Hedge Lords UI';
}
