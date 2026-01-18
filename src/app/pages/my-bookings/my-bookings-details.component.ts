import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-booking-dialog',
  template: `
    <h2 mat-dialog-title>Edit Offer Details</h2>
    <mat-dialog-content [formGroup]="form">
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 10px;">
        <mat-form-field appearance="outline">
          <mat-label>Price Offer (RON)</mat-label>
          <input matInput type="number" formControlName="price_offer">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Guest Count</mat-label>
          <input matInput type="number" formControlName="guest_count">
        </mat-form-field>
        
        <p style="font-size: 0.8rem; color: gray;">Note: You can only edit offers that are still pending.</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSave()">Save Changes</button>
    </mat-dialog-actions>
  `
})
export class MyBookingsDetailsComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<MyBookingsDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      price_offer: [data.price_offer, [Validators.required, Validators.min(1)]],
      guest_count: [data.guest_count, [Validators.required, Validators.min(1)]]
    });
  }

  onNoClick(): void { this.dialogRef.close(); }
  onSave(): void { this.dialogRef.close(this.form.value); }
}