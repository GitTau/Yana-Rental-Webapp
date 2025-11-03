import { City, Rate, Vehicle, Booking, User, BookingStatus, VehicleStatus, PaymentMode, UserRole, Battery, BatteryStatus } from './types';

export const CITIES: City[] = [
  { id: 1, name: 'San Francisco' },
  { id: 2, name: 'New York' },
  { id: 3, name: 'Austin' },
];

export const RATES: Rate[] = [
  { id: 1, cityId: 1, dailyRent: 25, securityDeposit: 100 },
  { id: 2, cityId: 2, dailyRent: 30, securityDeposit: 120 },
  { id: 3, cityId: 3, dailyRent: 22, securityDeposit: 90 },
  { id: 4, cityId: 1, clientName: 'Corporate A', dailyRent: 20, securityDeposit: 80 },
];

export const BATTERIES: Battery[] = [
  { id: 1, serialNumber: 'BATT-SF-001', cityId: 1, status: BatteryStatus.InUse, chargePercentage: 88, assignedVehicleId: 102 },
  { id: 2, serialNumber: 'BATT-SF-002', cityId: 1, status: BatteryStatus.Available, chargePercentage: 100, assignedVehicleId: null },
  { id: 3, serialNumber: 'BATT-NYC-001', cityId: 2, status: BatteryStatus.Charging, chargePercentage: 45, assignedVehicleId: null },
  { id: 4, serialNumber: 'BATT-NYC-002', cityId: 2, status: BatteryStatus.Available, chargePercentage: 92, assignedVehicleId: 103 },
  { id: 5, serialNumber: 'BATT-AU-001', cityId: 3, status: BatteryStatus.Available, chargePercentage: 76, assignedVehicleId: 105 },
  { id: 6, serialNumber: 'BATT-SF-003', cityId: 1, status: BatteryStatus.Maintenance, chargePercentage: 0, assignedVehicleId: null },
];

export const VEHICLES: Vehicle[] = [
  { id: 101, modelName: 'E-Bike One', cityId: 1, status: VehicleStatus.Available, batteryId: null },
  { id: 102, modelName: 'E-Bike One', cityId: 1, status: VehicleStatus.Rented, batteryId: 1 },
  { id: 103, modelName: 'E-Scooter Plus', cityId: 2, status: VehicleStatus.Available, batteryId: 4 },
  { id: 104, modelName: 'E-Scooter Plus', cityId: 2, status: VehicleStatus.Maintenance, batteryId: null },
  { id: 105, modelName: 'E-Bike Pro', cityId: 3, status: VehicleStatus.Available, batteryId: 5 },
  { id: 106, modelName: 'E-Bike Pro', cityId: 1, status: VehicleStatus.Available, batteryId: null },
];

export const BOOKINGS: Booking[] = [
  {
    id: 1,
    customerName: 'John Doe',
    customerPhone: '123-456-7890',
    vehicleId: 102,
    batteryId: 1,
    cityId: 1,
    startDate: '2024-07-28',
    endDate: '2024-07-30',
    dailyRent: 25,
    securityDeposit: 100,
    amountCollected: 150,
    modeOfPayment: PaymentMode.Card,
    status: BookingStatus.Active,
  },
];

export const USERS: User[] = [
  { id: 1, name: 'Admin User', role: UserRole.Admin, cityId: 1 },
  { id: 2, name: 'Operator SF', role: UserRole.Operator, cityId: 1 },
  { id: 3, name: 'Operator NYC', role: UserRole.Operator, cityId: 2 },
];

export const POST_RIDE_CHECKLIST_ITEMS = [
    { label: 'Nuts & Bolts', fine: 5 },
    { label: 'Headlight', fine: 20 },
    { label: 'Backlight', fine: 20 },
    { label: 'Tires & Rims', fine: 50 },
    { label: 'Fan', fine: 15 },
    { label: 'Number plates', fine: 10 },
    { label: 'Phone Stand', fine: 10 },
    { label: 'Foot rest', fine: 15 },
    { label: 'Side stand', fine: 15 },
    { label: 'Brake levers', fine: 25 },
    { label: 'Brake shoes', fine: 25 },
    { label: 'Motor', fine: 100 },
    { label: 'Scratches', fine: 30 },
    { label: 'Paint loss', fine: 40 },
    { label: 'Control Panel', fine: 60 },
    { label: 'Seat', fine: 20 },
];