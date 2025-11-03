import React, { useState } from 'react';
import { Booking, Vehicle, Rate, User, City, BookingStatus, VehicleStatus, Battery, BatteryStatus } from './types';
import { CITIES, RATES, VEHICLES, BOOKINGS, USERS, BATTERIES } from './constants';
import { OperationsPanel } from './components/OperationsPanel';
import AdminPanel from './components/AdminPanel';

type View = 'operations' | 'admin';

const App: React.FC = () => {
    // State Management
    const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
    const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
    const [rates, setRates] = useState<Rate[]>(RATES);
    const [users, setUsers] = useState<User[]>(USERS);
    const [cities, setCities] = useState<City[]>(CITIES);
    const [batteries, setBatteries] = useState<Battery[]>(BATTERIES);
    const [view, setView] = useState<View>('operations');
    const [selectedCityId, setSelectedCityId] = useState<number>(CITIES[0]?.id ?? 1);

    const addBooking = (newBookingData: Omit<Booking, 'id'>) => {
        const newBooking = { id: Date.now(), ...newBookingData };
        setBookings(prev => [...prev, newBooking]);
        
        setVehicles(prev => prev.map(v => 
            v.id === newBooking.vehicleId 
            ? { ...v, status: VehicleStatus.Rented, batteryId: newBooking.batteryId } 
            : v
        ));

        if (newBooking.batteryId) {
            setBatteries(prev => prev.map(b => 
                b.id === newBooking.batteryId 
                ? { ...b, status: BatteryStatus.InUse, assignedVehicleId: newBooking.vehicleId } 
                : b
            ));
        }
    };

    const updateBookingStatus = (bookingId: number, status: BookingStatus, checklistData?: { items: Record<string, boolean>, fine: number, notes: string }) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        setBookings(prev => prev.map(b => 
            b.id === bookingId 
            ? { 
                ...b, 
                status, 
                fineAmount: (b.fineAmount || 0) + (checklistData?.fine || 0),
                postRideChecklist: checklistData?.items,
                postRideNotes: checklistData?.notes,
              } 
            : b
        ));

        if (status === BookingStatus.Returned) {
            setVehicles(prevVehicles => {
                const vehicle = prevVehicles.find(v => v.id === booking.vehicleId);
                if (vehicle && vehicle.batteryId) {
                    setBatteries(prevBatteries => prevBatteries.map(b => b.id === vehicle.batteryId ? { ...b, status: BatteryStatus.Available, assignedVehicleId: null } : b));
                }
                return prevVehicles.map(v => v.id === booking.vehicleId ? { ...v, status: VehicleStatus.Available, batteryId: null } : v);
            });
        }
    };
    
    const changeBatteryForBooking = (bookingId: number, newBatteryId: number) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking || !booking.vehicleId) return;

        const vehicle = vehicles.find(v => v.id === booking.vehicleId);
        if (!vehicle) return;

        const oldBatteryId = vehicle.batteryId;

        // 1. Update Booking
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, batteryId: newBatteryId } : b));
        
        // 2. Update Vehicle
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, batteryId: newBatteryId } : v));
        
        // 3. Update Batteries (old and new)
        setBatteries(prev => prev.map(battery => {
            // Mark old battery as available
            if (battery.id === oldBatteryId) {
                return { ...battery, status: BatteryStatus.Available, assignedVehicleId: null };
            }
            // Mark new battery as in use
            if (battery.id === newBatteryId) {
                return { ...battery, status: BatteryStatus.InUse, assignedVehicleId: vehicle.id };
            }
            return battery;
        }));
    };

    const updateVehicle = (updatedVehicle: Vehicle) => {
        const originalVehicle = vehicles.find(v => v.id === updatedVehicle.id);
        if (!originalVehicle) return;

        setVehicles(prevVehicles => prevVehicles.map(v =>
            v.id === updatedVehicle.id ? updatedVehicle : v
        ));
        
        const oldBatteryId = originalVehicle.batteryId;
        const newBatteryId = updatedVehicle.batteryId;

        if (oldBatteryId !== newBatteryId) {
            setBatteries(prevBatteries => {
                return prevBatteries.map(battery => {
                    if (battery.id === oldBatteryId) {
                        return { ...battery, status: BatteryStatus.Available, assignedVehicleId: null };
                    }
                    if (battery.id === newBatteryId) {
                        const newBatteryStatus = updatedVehicle.status === VehicleStatus.Rented ? BatteryStatus.InUse : BatteryStatus.Available;
                        return { ...battery, status: newBatteryStatus, assignedVehicleId: updatedVehicle.id };
                    }
                    return battery;
                });
            });
        }
    };

    const updateBattery = (updatedBattery: Battery) => {
        setBatteries(prevBatteries => prevBatteries.map(b =>
            b.id === updatedBattery.id ? updatedBattery : b
        ));
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-gray-800">Bike Rental Management</h1>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setView('operations')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'operations' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Operations
                            </button>
                            <button 
                                onClick={() => setView('admin')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main>
                {view === 'operations' ? (
                    <>
                        <div className="bg-white border-b border-gray-200">
                            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-px flex space-x-8" aria-label="Tabs">
                                {cities.map((city) => (
                                    <button
                                        key={city.id}
                                        onClick={() => setSelectedCityId(city.id)}
                                        className={`${
                                            city.id === selectedCityId
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        {city.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <OperationsPanel 
                            selectedCityId={selectedCityId}
                            bookings={bookings}
                            vehicles={vehicles}
                            rates={rates}
                            cities={cities}
                            batteries={batteries}
                            users={users}
                            addBooking={addBooking}
                            updateBookingStatus={updateBookingStatus}
                            changeBatteryForBooking={changeBatteryForBooking}
                        />
                    </>
                ) : (
                    <div className="max-w-7xl mx-auto">
                        <AdminPanel
                            rates={rates}
                            vehicles={vehicles}
                            users={users}
                            cities={cities}
                            bookings={bookings}
                            batteries={batteries}
                            updateVehicle={updateVehicle}
                            updateBattery={updateBattery}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;