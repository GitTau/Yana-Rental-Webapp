import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Vehicle, Rate, City, VehicleStatus, BookingStatus, PaymentMode, Battery, BatteryStatus, User } from '../types';
import { BikeIcon, MoneyIcon, PlusIcon, BoltIcon, ArrowPathIcon } from './icons';
import { POST_RIDE_CHECKLIST_ITEMS } from '../constants';

interface OperationsPanelProps {
  selectedCityId: number;
  bookings: Booking[];
  vehicles: Vehicle[];
  rates: Rate[];
  cities: City[];
  batteries: Battery[];
  users: User[];
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBookingStatus: (bookingId: number, status: BookingStatus, checklistData?: { items: Record<string, boolean>, fine: number, notes: string }) => void;
  changeBatteryForBooking: (bookingId: number, newBatteryId: number) => void;
}

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

const DashboardCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const BookingForm: React.FC<{
    cityId: number;
    vehicles: Vehicle[];
    rates: Rate[];
    batteries: Battery[];
    bookings: Booking[];
    addBooking: (booking: Omit<Booking, 'id'>) => void;
    onClose: () => void;
}> = ({ cityId, vehicles, rates, batteries, bookings, addBooking, onClose }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [vehicleId, setVehicleId] = useState<number | ''>('');
    const [batteryId, setBatteryId] = useState<number | ''>('');
    const [startDate, setStartDate] = useState(getTodayDateString());
    const [endDate, setEndDate] = useState(getTodayDateString());
    const [cashCollected, setCashCollected] = useState('');
    const [onlineCollected, setOnlineCollected] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [customerPending, setCustomerPending] = useState<number | null>(null);

    useEffect(() => {
        if (customerPhone.length >= 10) { // A simple validation
            const customerBookings = bookings.filter(b => b.customerPhone === customerPhone);
            if (customerBookings.length > 0) {
                 let totalPotentialRent = 0;
                 let totalAmountCollected = 0;
                 let totalSecurityCollected = 0;
    
                customerBookings.forEach(b => {
                    const days = calculateDays(b.startDate, b.endDate);
                    totalPotentialRent += days * b.dailyRent;
                    totalAmountCollected += b.amountCollected;
                    totalSecurityCollected += Math.min(b.amountCollected, b.securityDeposit);
                });
                
                const totalRentCollected = totalAmountCollected - totalSecurityCollected;
                const pending = Math.max(0, totalPotentialRent - totalRentCollected);
                setCustomerPending(pending);
            } else {
                setCustomerPending(0); // New customer or no pending dues
            }
        } else {
            setCustomerPending(null); // Not yet checked
        }
    }, [customerPhone, bookings]);

    const availableVehicles = useMemo(() => {
        return vehicles.filter(v => v.status === VehicleStatus.Available);
    }, [vehicles]);

    const availableBatteries = useMemo(() => {
        return batteries.filter(b => 
            (b.status === BatteryStatus.Available || b.status === BatteryStatus.Charging) && 
            !b.assignedVehicleId
        );
    }, [batteries]);

    const rate = useMemo(() => {
        return rates.find(r => r.cityId === cityId && !r.clientName) || null;
    }, [rates, cityId]);

    const numDays = useMemo(() => calculateDays(startDate, endDate), [startDate, endDate]);
    const totalRent = useMemo(() => (rate?.dailyRent || 0) * numDays, [rate, numDays]);
    const securityDeposit = useMemo(() => rate?.securityDeposit || 0, [rate]);
    const totalPayable = totalRent + securityDeposit;
    const totalCollected = (Number(cashCollected) || 0) + (Number(onlineCollected) || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let determinedPaymentMode: PaymentMode;
        const cash = Number(cashCollected) || 0;
        const online = Number(onlineCollected) || 0;

        if (cash > 0 && online > 0) {
            determinedPaymentMode = PaymentMode.Other;
        } else if (cash > 0) {
            determinedPaymentMode = PaymentMode.Cash;
        } else if (online > 0) {
            determinedPaymentMode = PaymentMode.UPI;
        } else {
            determinedPaymentMode = PaymentMode.Other; 
        }

        addBooking({
            customerName,
            customerPhone,
            vehicleId: Number(vehicleId),
            batteryId: batteryId ? Number(batteryId) : null,
            cityId,
            startDate,
            endDate,
            dailyRent: rate!.dailyRent,
            securityDeposit: securityDeposit,
            amountCollected: totalCollected,
            modeOfPayment: determinedPaymentMode,
            status: BookingStatus.Active,
        });
        onClose();
    };
    
    const isBookingDisabled = !customerName || !customerPhone || !vehicleId || !rate || (customerPending !== null && customerPending > 0) || totalPayable !== totalCollected;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Add New Booking</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="tel" placeholder="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-2 border rounded" required />
                    
                    {customerPending !== null && customerPending > 0 && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 my-2 text-sm" role="alert">
                            <p className="font-bold">Outstanding Balance</p>
                            <p>This customer has a pending balance of ${customerPending.toFixed(2)}. New bookings are not allowed.</p>
                        </div>
                    )}

                    <select value={vehicleId} onChange={e => setVehicleId(Number(e.target.value))} className="w-full p-2 border rounded bg-white" required>
                        <option value="">Select Vehicle</option>
                        {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.modelName} (ID: {v.id})</option>)}
                    </select>
                     <select value={batteryId} onChange={e => setBatteryId(Number(e.target.value))} className="w-full p-2 border rounded bg-white">
                        <option value="">Select Battery (Optional)</option>
                        {availableBatteries.map(b => <option key={b.id} value={b.id}>{b.serialNumber} ({b.chargePercentage}%)</option>)}
                    </select>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={getTodayDateString()} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full p-2 border rounded" required />
                        </div>
                    </div>
                    {rate && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
                            <p><strong>Daily Rent:</strong> ${rate.dailyRent}</p>
                            <p><strong>Security Deposit:</strong> ${securityDeposit}</p>
                            <p><strong>Number of Days:</strong> {numDays}</p>
                            <p className="font-bold mt-1"><strong>Total Rent:</strong> ${totalRent}</p>
                            <p className="font-bold mt-1 text-blue-600 border-t pt-1"><strong>Total Payable:</strong> ${totalPayable}</p>
                        </div>
                    )}
                    
                    {!showPayment && totalPayable > 0 ? (
                        <button type="button" onClick={() => setShowPayment(true)} className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold text-lg flex justify-center items-center transition hover:bg-green-600">
                            Collect Payment: ${totalPayable}
                        </button>
                    ) : (
                        <div className="p-4 border rounded-md bg-gray-50 space-y-3">
                            <h3 className="font-bold text-md text-gray-800">Payment Collection</h3>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Cash Collected</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={cashCollected} 
                                    onChange={e => setCashCollected(e.target.value)} 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Online Collected (UPI, Card)</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={onlineCollected} 
                                    onChange={e => setOnlineCollected(e.target.value)} 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>
                            <div className="text-right font-bold text-sm pt-2 border-t">
                                <p>Total Collected: <span className="text-green-600">${totalCollected}</span></p>
                                <p>Pending: <span className="text-red-600">${Math.max(0, totalPayable - totalCollected)}</span></p>
                            </div>
                             {totalPayable > 0 && totalPayable !== totalCollected && (
                                <p className="text-xs text-center text-red-500 pt-2">
                                    Please collect the full payable amount to enable booking.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isBookingDisabled}
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Add Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChangeBatteryForm: React.FC<{
    booking: Booking;
    vehicles: Vehicle[];
    batteries: Battery[];
    onClose: () => void;
    onConfirm: (bookingId: number, newBatteryId: number) => void;
}> = ({ booking, vehicles, batteries, onClose, onConfirm }) => {
    const [newBatteryId, setNewBatteryId] = useState<number | ''>('');

    const vehicle = vehicles.find(v => v.id === booking.vehicleId);
    const currentBattery = batteries.find(b => b.id === vehicle?.batteryId);
    
    const availableBatteries = useMemo(() => {
        return batteries.filter(b => 
            b.status === BatteryStatus.Available && 
            !b.assignedVehicleId
        );
    }, [batteries]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBatteryId) {
            alert('Please select a new battery.');
            return;
        }
        onConfirm(booking.id, Number(newBatteryId));
        onClose();
    };

    if (!vehicle) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Change Battery</h2>
                <div className="space-y-3 text-sm mb-6 bg-gray-50 p-3 rounded-md">
                    <p><strong>Customer:</strong> {booking.customerName}</p>
                    <p><strong>Vehicle:</strong> {vehicle.modelName} (ID: {vehicle.id})</p>
                    <p><strong>Current Battery:</strong> {currentBattery?.serialNumber || 'N/A'}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select New Battery</label>
                        <select 
                            value={newBatteryId} 
                            onChange={e => setNewBatteryId(Number(e.target.value))} 
                            className="w-full p-2 border rounded bg-white mt-1" 
                            required
                        >
                            <option value="">Select an available battery</option>
                            {availableBatteries.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.serialNumber} ({b.chargePercentage}%)
                                </option>
                            ))}
                        </select>
                         {availableBatteries.length === 0 && <p className="text-xs text-red-500 mt-1">No available batteries in this city.</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" disabled={!newBatteryId || availableBatteries.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">Confirm Change</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PostRideChecklistModal: React.FC<{
    booking: Booking;
    onClose: () => void;
    onConfirm: (bookingId: number, status: BookingStatus, checklistData: { items: Record<string, boolean>, fine: number, notes: string }) => void;
}> = ({ booking, onClose, onConfirm }) => {
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [otherNotes, setOtherNotes] = useState('');

    const toggleItem = (label: string) => {
        setSelectedItems(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const totalFine = useMemo(() => {
        return POST_RIDE_CHECKLIST_ITEMS.reduce((total, item) => {
            return selectedItems[item.label] ? total + item.fine : total;
        }, 0);
    }, [selectedItems]);

    const handleSubmit = () => {
        onConfirm(booking.id, BookingStatus.Returned, { items: selectedItems, fine: totalFine, notes: otherNotes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full flex flex-col">
                <h2 className="text-xl font-bold mb-2">Post-Ride Checklist</h2>
                <p className="text-sm text-gray-600 mb-4">Select items with damage to add fines. For booking #{booking.id}.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-2 flex-grow">
                    {POST_RIDE_CHECKLIST_ITEMS.map(item => (
                        <button
                            key={item.label}
                            onClick={() => toggleItem(item.label)}
                            className={`p-3 rounded-md text-sm text-left transition-colors ${selectedItems[item.label] ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <div className="font-medium">{item.label}</div>
                            <div className={`text-xs ${selectedItems[item.label] ? 'text-red-100' : 'text-gray-500'}`}>Fine: ${item.fine}</div>
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    <label htmlFor="otherNotes" className="text-sm font-medium text-gray-700">Other Notes</label>
                    <textarea
                        id="otherNotes"
                        value={otherNotes}
                        onChange={(e) => setOtherNotes(e.target.value)}
                        rows={2}
                        className="w-full p-2 border rounded mt-1"
                        placeholder="e.g., Deep scratch on the left side..."
                    />
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-lg font-bold">
                        Total Fine: <span className="text-red-600">${totalFine}</span>
                    </div>
                    <div className="flex space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm & Return</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    const statusClasses = {
        [BookingStatus.Active]: 'bg-green-100 text-green-800',
        [BookingStatus.Returned]: 'bg-gray-200 text-gray-800',
        [BookingStatus.PendingPayment]: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>{status}</span>;
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({ selectedCityId, bookings, vehicles, rates, cities, batteries, users, addBooking, updateBookingStatus, changeBatteryForBooking }) => {
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [batteryChangeBooking, setBatteryChangeBooking] = useState<Booking | null>(null);
    const [checkingInBooking, setCheckingInBooking] = useState<Booking | null>(null);

    const cityBookings = useMemo(() => bookings.filter(b => b.cityId === selectedCityId), [bookings, selectedCityId]);
    const cityVehicles = useMemo(() => vehicles.filter(v => v.cityId === selectedCityId), [vehicles, selectedCityId]);
    const cityBatteries = useMemo(() => batteries.filter(b => b.cityId === selectedCityId), [batteries, selectedCityId]);
    const cityUsers = useMemo(() => users.filter(u => u.cityId === selectedCityId), [users, selectedCityId]);

    const dashboardStats = useMemo(() => {
        const today = getTodayDateString();
        const todaysBookings = cityBookings.filter(b => b.startDate === today);

        let rentCollectedToday = 0;
        let securityCollectedToday = 0;

        todaysBookings.forEach(b => {
            securityCollectedToday += Math.min(b.amountCollected, b.securityDeposit);
            rentCollectedToday += Math.max(0, b.amountCollected - b.securityDeposit);
        });
        
        return {
            rentCollectedToday: `$${rentCollectedToday}`,
            securityCollectedToday: `$${securityCollectedToday}`,
            activeRentals: cityBookings.filter(b => b.status === BookingStatus.Active).length,
            availableBikes: cityVehicles.filter(v => v.status === VehicleStatus.Available).length,
        };
    }, [cityBookings, cityVehicles]);

    const cityCustomers = useMemo(() => {
        const customers: Record<string, { name: string; bookings: Booking[] }> = {};
        cityBookings.forEach(booking => {
            if (!customers[booking.customerPhone]) {
                customers[booking.customerPhone] = {
                    name: booking.customerName,
                    bookings: [],
                };
            }
            customers[booking.customerPhone].bookings.push(booking);
        });

        return Object.entries(customers).map(([phone, data]) => {
            let totalDaysInCity = 0;
            let totalPotentialRentInCity = 0;
            let totalRentCollectedInCity = 0;

            data.bookings.forEach(b => {
                const days = calculateDays(b.startDate, b.endDate);
                totalDaysInCity += days;
                totalPotentialRentInCity += days * b.dailyRent;
                const rentCollected = Math.max(0, b.amountCollected - b.securityDeposit);
                totalRentCollectedInCity += rentCollected;
            });

            const pendingRentInCity = Math.max(0, totalPotentialRentInCity - totalRentCollectedInCity);

            return {
                phone,
                name: data.name,
                bookingCount: data.bookings.length,
                totalDaysInCity,
                pendingRentInCity,
                lastBookingDate: data.bookings.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].startDate
            }
        }).sort((a, b) => b.bookingCount - a.bookingCount);
    }, [cityBookings]);

    const getVehicleModel = (id: number) => vehicles.find(v => v.id === id)?.modelName || 'Unknown';
    const getCityName = (id: number) => cities.find(c => c.id === id)?.name || 'Unknown';
    const getBatterySN = (id: number) => batteries.find(b => b.id === id)?.serialNumber || 'N/A';

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="Rent Collected Today" value={dashboardStats.rentCollectedToday} icon={<MoneyIcon />} />
                <DashboardCard title="Security Collected Today" value={dashboardStats.securityCollectedToday} icon={<MoneyIcon className="text-indigo-500"/>} />
                <DashboardCard title="Active Rentals" value={dashboardStats.activeRentals} icon={<BikeIcon className="text-green-500"/>} />
                <DashboardCard title="Available Bikes" value={dashboardStats.availableBikes} icon={<BikeIcon className="text-blue-500"/>} />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Current Bookings</h2>
                    <button onClick={() => setShowBookingForm(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        <PlusIcon className="w-5 h-5" />
                        <span>New Booking</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Vehicle</th>
                                <th className="p-3">Period</th>
                                <th className="p-3">Payment</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cityBookings.map(booking => {
                                const totalRent = calculateDays(booking.startDate, booking.endDate) * booking.dailyRent;
                                const totalPayable = totalRent + booking.securityDeposit + (booking.fineAmount || 0);
                                const pendingAmount = Math.max(0, totalPayable - booking.amountCollected);

                                return (
                                <tr key={booking.id} className="border-b">
                                    <td className="p-3">
                                        <div className="font-medium">{booking.customerName}</div>
                                        <div className="text-gray-500">{booking.customerPhone}</div>
                                    </td>
                                    <td className="p-3">
                                        <div>{getVehicleModel(booking.vehicleId)}</div>
                                        <div className="text-gray-500 text-xs">{getCityName(booking.cityId)}</div>
                                        {booking.batteryId && (
                                            <div className="text-xs text-blue-600 flex items-center space-x-1 mt-1 font-medium">
                                                <BoltIcon className="w-3 h-3"/>
                                                <span>{getBatterySN(booking.batteryId)}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div>Rent: ${totalRent}</div>
                                        {booking.fineAmount && booking.fineAmount > 0 && (
                                            <div className="text-red-600 font-medium">Fine: ${booking.fineAmount}</div>
                                        )}
                                        {pendingAmount > 0 && (
                                            <div className="text-red-600 font-medium">Pending: ${pendingAmount.toFixed(2)}</div>
                                        )}
                                    </td>
                                    <td className="p-3"><StatusBadge status={booking.status} /></td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            {booking.status === BookingStatus.Active && (
                                                <>
                                                    <button 
                                                        onClick={() => setCheckingInBooking(booking)}
                                                        disabled={pendingAmount > 0}
                                                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        title={pendingAmount > 0 ? `Cannot return: $${pendingAmount.toFixed(2)} pending` : 'Mark as Returned'}
                                                    >
                                                        Mark Returned
                                                    </button>
                                                     <button
                                                        onClick={() => setBatteryChangeBooking(booking)}
                                                        className="bg-yellow-500 text-white p-1.5 rounded-md text-xs hover:bg-yellow-600"
                                                        title="Change Battery"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">City Customers</h2>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Total Bookings</th>
                                <th className="p-3">Total Days</th>
                                <th className="p-3">Pending Rent</th>
                                <th className="p-3">Last Booking</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cityCustomers.map(customer => (
                                <tr key={customer.phone} className="border-b">
                                    <td className="p-3">
                                        <div className="font-medium">{customer.name}</div>
                                        <div className="text-gray-500">{customer.phone}</div>
                                    </td>
                                    <td className="p-3">{customer.bookingCount}</td>
                                    <td className="p-3">{customer.totalDaysInCity}</td>
                                    <td className="p-3 font-medium text-red-600">${customer.pendingRentInCity.toFixed(2)}</td>
                                    <td className="p-3">{new Date(customer.lastBookingDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {cityCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">No customers found for this city.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showBookingForm && <BookingForm 
                cityId={selectedCityId}
                vehicles={cityVehicles}
                rates={rates}
                batteries={cityBatteries}
                bookings={bookings}
                addBooking={addBooking} 
                onClose={() => setShowBookingForm(false)} 
            />}
            {batteryChangeBooking && (
                <ChangeBatteryForm
                    booking={batteryChangeBooking}
                    vehicles={cityVehicles}
                    batteries={cityBatteries}
                    onClose={() => setBatteryChangeBooking(null)}
                    onConfirm={changeBatteryForBooking}
                />
            )}
             {checkingInBooking && (
                <PostRideChecklistModal
                    booking={checkingInBooking}
                    onClose={() => setCheckingInBooking(null)}
                    onConfirm={updateBookingStatus}
                />
            )}
        </div>
    );
};