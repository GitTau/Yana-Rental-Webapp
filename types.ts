export enum BookingStatus {
  Active = 'Active',
  Returned = 'Returned',
  PendingPayment = 'Pending Payment',
}

export enum VehicleStatus {
  Available = 'Available',
  Rented = 'Rented',
  Maintenance = 'Maintenance',
}

export enum BatteryStatus {
  Available = 'Available',
  InUse = 'InUse',
  Charging = 'Charging',
  Maintenance = 'Maintenance',
}

export enum PaymentMode {
  Cash = 'Cash',
  UPI = 'UPI',
  Card = 'Card',
  Other = 'Other',
}

export enum UserRole {
  Admin = 'Admin',
  Operator = 'Operator',
}

export enum ChecklistType {
  PreRide = 'Pre-Ride',
  PostRide = 'Post-Ride',
}

export interface City {
  id: number;
  name: string;
}

export interface Rate {
  id: number;
  cityId: number;
  clientName?: string;
  dailyRent: number;
  securityDeposit: number;
}

export interface Vehicle {
  id: number;
  modelName: string;
  cityId: number;
  status: VehicleStatus;
  batteryId: number | null;
}

export interface Battery {
  id: number;
  serialNumber: string;
  cityId: number;
  status: BatteryStatus;
  chargePercentage: number;
  assignedVehicleId: number | null;
}

export interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  batteryId: number | null;
  cityId: number;
  startDate: string;
  endDate: string;
  dailyRent: number;
  securityDeposit: number;
  amountCollected: number;
  modeOfPayment: PaymentMode;
  status: BookingStatus;
  fineAmount?: number;
  postRideChecklist?: Record<string, boolean>;
  postRideNotes?: string;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  cityId: number;
}

export interface Checklist {
  id: number;
  vehicleId: number;
  bookingId: number;
  type: ChecklistType;
  tyres: boolean;
  brakes: boolean;
  battery: boolean;
  notes?: string;
}