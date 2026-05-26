import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DeleteConfirmData {
  title: string;
}

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete Task</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete "<strong>{{ data.title }}</strong>"?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content p {
      margin: 4px 0;
      color: #555;
    }
  `],
})
export class DeleteConfirmDialogComponent {
  data: DeleteConfirmData = inject(MAT_DIALOG_DATA);
}
