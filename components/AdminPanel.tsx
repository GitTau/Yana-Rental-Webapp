
import React, { useState, useMemo } from 'react';
import { Rate, Vehicle, User, City, VehicleStatus, UserRole, Booking, BookingStatus, Battery, BatteryStatus } from '../types';
import { PlusIcon, UserGroupIcon, BikeIcon, MoneyIcon, DocumentChartBarIcon, BoltIcon, UserIcon } from './icons';

type AdminSection = 'rates' | 'inventory' | 'users' | 'reports' | 'batteries' | 'customers';

const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

const VehicleEditForm: React.FC<{
    vehicle: Vehicle;
    cities: City[];
    batteries: Battery[];
    onSave: (vehicle: Vehicle) => void;
    onClose: () => void;
}> = ({ vehicle, cities, batteries, onSave, onClose }) => {
    const [modelName, setModelName] = useState(vehicle.modelName);
    const [cityId, setCityId] = useState(vehicle.cityId);
    const [status, setStatus] = useState(vehicle.status);
    const [batteryId, setBatteryId] = useState<number | ''>(vehicle.batteryId ?? '');
    
    const availableBatteries = useMemo(() => {
        const currentBattery = batteries.find(b => b.id === vehicle.batteryId);
        const otherAvailable = batteries.filter(b => 
            (b.status === BatteryStatus.Available || b.status === BatteryStatus.Charging) && 
            b.cityId === vehicle.cityId &&
            !b.assignedVehicleId
        );
        const options = [...otherAvailable];
        if (currentBattery && !otherAvailable.some(b => b.id === currentBattery.id)) {
            options.unshift(currentBattery);
        }
        return options;
    }, [batteries, vehicle.cityId, vehicle.batteryId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...vehicle,
            modelName,
            cityId,
            status,
            batteryId: batteryId ? Number(batteryId) : null
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Vehicle (ID: {vehicle.id})</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Model Name</label>
                        <input type="text" value={modelName} onChange={e => setModelName(e.target.value)} className="w-full p-2 border rounded mt-1" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <select value={cityId} onChange={e => setCityId(Number(e.target.value))} className="w-full p-2 border rounded bg-white mt-1" required >
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Battery</label>
                        <select value={batteryId} onChange={e => setBatteryId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded bg-white mt-1" >
                            <option value="">No Battery</option>
                            {availableBatteries.map(b => <option key={b.id} value={b.id}>{b.serialNumber} ({b.chargePercentage}%)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as VehicleStatus)} className="w-full p-2 border rounded bg-white mt-1" required >
                            {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const VehicleStatusBadge: React.FC<{ status: VehicleStatus }> = ({ status }) => {
    const statusClasses = {
        [VehicleStatus.Available]: 'bg-green-100 text-green-800',
        [VehicleStatus.Rented]: 'bg-yellow-100 text-yellow-800',
        [VehicleStatus.Maintenance]: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>{status}</span>;
}

const BatteryStatusBadge: React.FC<{ status: BatteryStatus }> = ({ status }) => {
    const statusClasses = {
        [BatteryStatus.Available]: 'bg-green-100 text-green-800',
        [BatteryStatus.InUse]: 'bg-blue-100 text-blue-800',
        [BatteryStatus.Charging]: 'bg-yellow-100 text-yellow-800',
        [BatteryStatus.Maintenance]: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>{status}</span>;
}


const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    const statusClasses = {
        [BookingStatus.Active]: 'bg-green-100 text-green-800',
        [BookingStatus.Returned]: 'bg-gray-200 text-gray-800',
        [BookingStatus.PendingPayment]: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>{status}</span>;
}

const AdminPanel: React.FC<{
  rates: Rate[];
  vehicles: Vehicle[];
  users: User[];
  cities: City[];
  bookings: Booking[];
  batteries: Battery[];
  updateVehicle: (vehicle: Vehicle) => void;
  updateBattery: (battery: Battery) => void;
}> = ({ rates, vehicles, users, cities, bookings, batteries, updateVehicle, updateBattery }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('reports');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const SectionButton: React.FC<{ section: AdminSection; label: string; icon: React.ReactNode }> = ({ section, label, icon }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center justify-center sm:justify-start space-x-2 p-3 rounded-lg text-sm font-medium w-full text-left ${activeSection === section ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
  );
  
  const ReportsSection = () => {
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const getPastDateString = (daysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getPastDateString(30));
    const [endDate, setEndDate] = useState(getTodayDateString());

    const filteredBookings = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end day

        return bookings.filter(b => {
            const bookingDate = new Date(b.startDate);
            return bookingDate >= start && bookingDate <= end;
        });
    }, [bookings, startDate, endDate]);

    const { rentCollected, securityCollected, totalBookings, pendingRent } = useMemo(() => {
        let rentCollected = 0;
        let securityCollected = 0;
        let potentialRent = 0;

        filteredBookings.forEach(b => {
            securityCollected += Math.min(b.amountCollected, b.securityDeposit);
            rentCollected += Math.max(0, b.amountCollected - b.securityDeposit);
            potentialRent += calculateDays(b.startDate, b.endDate) * b.dailyRent;
        });
        
        const pendingRent = potentialRent - rentCollected;

        return {
            rentCollected,
            securityCollected,
            totalBookings: filteredBookings.length,
            pendingRent: Math.max(0, pendingRent)
        };
    }, [filteredBookings]);

    const getVehicleModel = (id: number) => vehicles.find(v => v.id === id)?.modelName || 'Unknown';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                 <h3 className="text-xl font-bold">Reports</h3>
                 <div className="flex items-center space-x-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm"/>
                    <span className="text-gray-500">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm"/>
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Rent Collected</p>
                    <p className="text-3xl font-bold">${rentCollected}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Security Collected</p>
                    <p className="text-3xl font-bold">${securityCollected}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Pending Rent</p>
                    <p className="text-3xl font-bold">${pendingRent}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Total Bookings</p>
                    <p className="text-3xl font-bold">{totalBookings}</p>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <h4 className="p-4 text-lg font-bold">Bookings in Selected Range</h4>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-left">Vehicle</th>
                            <th className="p-3 text-left">Period</th>
                            <th className="p-3 text-left">Total Rent</th>
                            <th className="p-3 text-left">Collected</th>
                            <th className="p-3 text-left">Pending</th>
                            <th className="p-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map(b => {
                            const totalRent = calculateDays(b.startDate, b.endDate) * b.dailyRent;
                            const pending = totalRent - b.amountCollected;
                            return (
                                <tr key={b.id} className="border-b">
                                    <td className="p-3">
                                        <div className="font-medium">{b.customerName}</div>
                                        <div className="text-xs text-gray-500">{b.customerPhone}</div>
                                    </td>
                                    <td className="p-3">{getVehicleModel(b.vehicleId)}</td>
                                    <td className="p-3">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">${totalRent}</td>
                                    <td className="p-3 text-green-600">${b.amountCollected}</td>
                                    <td className="p-3 text-red-600">${pending > 0 ? pending : 0}</td>
                                    <td className="p-3"><BookingStatusBadge status={b.status} /></td>
                                </tr>
                            )
                        })}
                         {filteredBookings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center p-4 text-gray-500">No bookings found for the selected date range.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const InventorySection = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Inventory Management</h3>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add Vehicle</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Vehicle ID</th>
              <th className="p-3 text-left">Model Name</th>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Battery S/N</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-3">{v.id}</td>
                <td className="p-3 font-medium">{v.modelName}</td>
                <td className="p-3">{cities.find(c => c.id === v.cityId)?.name}</td>
                <td className="p-3">{batteries.find(b => b.id === v.batteryId)?.serialNumber || 'N/A'}</td>
                <td className="p-3">
                  <VehicleStatusBadge status={v.status} />
                </td>
                <td className="p-3">
                    <button 
                        onClick={() => setEditingVehicle(v)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-200"
                    >
                        Edit
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingVehicle && (
        <VehicleEditForm 
            vehicle={editingVehicle}
            cities={cities}
            batteries={batteries}
            onSave={(updatedVehicle) => {
                updateVehicle(updatedVehicle);
                setEditingVehicle(null);
            }}
            onClose={() => setEditingVehicle(null)}
        />
      )}
    </div>
  );
  
  const BatteriesSection = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Battery Management</h3>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add Battery</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Serial Number</th>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Charge</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Assigned Vehicle ID</th>
            </tr>
          </thead>
          <tbody>
            {batteries.map(b => (
              <tr key={b.id} className="border-b">
                <td className="p-3 font-medium">{b.serialNumber}</td>
                <td className="p-3">{cities.find(c => c.id === b.cityId)?.name}</td>
                <td className="p-3">{b.chargePercentage}%</td>
                <td className="p-3"><BatteryStatusBadge status={b.status} /></td>
                <td className="p-3">{b.assignedVehicleId || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RatesSection = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Rates & Rules</h3>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add Rate</span>
        </button>
      </div>
       <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Daily Rent</th>
              <th className="p-3 text-left">Security Deposit</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-3 font-medium">{cities.find(c => c.id === r.cityId)?.name}</td>
                <td className="p-3">{r.clientName || 'Standard'}</td>
                <td className="p-3">${r.dailyRent}</td>
                <td className="p-3">${r.securityDeposit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const UsersSection = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">User Management</h3>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add User</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Assigned City</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{cities.find(c => c.id === u.cityId)?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CustomersSection = () => {
    const customerData = useMemo(() => {
        const customers: { [phone: string]: { name: string; bookings: Booking[] } } = {};

        bookings.forEach(booking => {
            if (!customers[booking.customerPhone]) {
                customers[booking.customerPhone] = { name: booking.customerName, bookings: [booking] };
            } else {
                customers[booking.customerPhone].bookings.push(booking);
            }
        });

        return Object.entries(customers).map(([phone, data]) => {
            let totalRentalDays = 0;
            let totalPotentialRent = 0;
            let totalAmountCollected = 0;
            let totalSecurityCollected = 0;

            data.bookings.forEach(b => {
                const days = calculateDays(b.startDate, b.endDate);
                totalRentalDays += days;
                totalPotentialRent += days * b.dailyRent;
                totalAmountCollected += b.amountCollected;
                totalSecurityCollected += Math.min(b.amountCollected, b.securityDeposit);
            });

            const totalRentCollected = totalAmountCollected - totalSecurityCollected;
            const pendingRent = Math.max(0, totalPotentialRent - totalRentCollected);

            const lastBooking = data.bookings.reduce((latest, current) => {
                return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
            });

            return {
                phone,
                name: data.name,
                bookingCount: data.bookings.length,
                totalRentalDays,
                totalRentCollected,
                totalSecurityCollected,
                pendingRent,
                lastBookingDate: lastBooking.startDate,
            };
        }).sort((a, b) => new Date(b.lastBookingDate).getTime() - new Date(a.lastBookingDate).getTime());
    }, [bookings]);

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Customer Directory</h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Total Bookings</th>
                <th className="p-3 text-left">Total Days</th>
                <th className="p-3 text-left">Rent Collected</th>
                <th className="p-3 text-left">Security Collected</th>
                <th className="p-3 text-left">Pending Rent</th>
                <th className="p-3 text-left">Last Booking</th>
              </tr>
            </thead>
            <tbody>
              {customerData.map(customer => (
                <tr key={customer.phone} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="p-3">{customer.bookingCount}</td>
                  <td className="p-3">{customer.totalRentalDays}</td>
                  <td className="p-3 font-medium text-green-600">${customer.totalRentCollected.toFixed(2)}</td>
                  <td className="p-3 font-medium">${customer.totalSecurityCollected.toFixed(2)}</td>
                  <td className="p-3 font-medium text-red-600">${customer.pendingRent.toFixed(2)}</td>
                  <td className="p-3">{new Date(customer.lastBookingDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-81px)]">
      <nav className="w-full md:w-48 lg:w-56 bg-white p-4 space-y-2 border-b md:border-b-0 md:border-r flex flex-row md:flex-col justify-around md:justify-start">
        <SectionButton section="reports" label="Reports" icon={<DocumentChartBarIcon className="w-5 h-5"/>} />
        <SectionButton section="inventory" label="Inventory" icon={<BikeIcon className="w-5 h-5"/>} />
        <SectionButton section="batteries" label="Batteries" icon={<BoltIcon className="w-5 h-5"/>} />
        <SectionButton section="rates" label="Rates" icon={<MoneyIcon className="w-5 h-5"/>} />
        <SectionButton section="users" label="Users" icon={<UserIcon className="w-5 h-5"/>} />
        <SectionButton section="customers" label="Customers" icon={<UserGroupIcon className="w-5 h-5"/>} />
      </nav>
      <main className="flex-1 p-4 md:p-6 bg-gray-50">
        {activeSection === 'reports' && <ReportsSection />}
        {activeSection === 'inventory' && <InventorySection />}
        {activeSection === 'batteries' && <BatteriesSection />}
        {activeSection === 'rates' && <RatesSection />}
        {activeSection === 'users' && <UsersSection />}
        {activeSection === 'customers' && <CustomersSection />}
      </main>
    </div>
  );
};

export default AdminPanel;
