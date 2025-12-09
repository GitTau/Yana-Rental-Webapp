
import React, { useState, useMemo, useEffect } from 'react';
import { Rate, Vehicle, User, City, VehicleStatus, UserRole, Booking, BookingStatus, Battery, BatteryStatus, RefundRequest } from '../types';
import { PlusIcon, UserGroupIcon, BikeIcon, MoneyIcon, DocumentChartBarIcon, BoltIcon, UserIcon, ArrowPathIcon } from './icons';

type AdminSection = 'rates' | 'inventory' | 'users' | 'reports' | 'batteries' | 'customers' | 'refunds' | 'pending-payments' | 'cities';

const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

const getDaysOverdue = (booking: Booking) => {
    const today = new Date();
    const refDate = new Date(booking.status === BookingStatus.Active ? booking.startDate : booking.endDate);
    const diffTime = today.getTime() - refDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// --- MODAL COMPONENTS ---

const ManageVehiclesModal: React.FC<{
    vehicles: Vehicle[];
    cities: City[];
    batteries: Battery[];
    onClose: () => void;
    onAdd: (v: Omit<Vehicle, 'id'>) => void;
    onUpdate: (v: Vehicle) => void;
    onDelete: (id: number) => void;
    onBulk: (v: Omit<Vehicle, 'id'>[]) => void;
}> = ({ vehicles, cities, batteries, onClose, onAdd, onUpdate, onDelete, onBulk }) => {
    const [tab, setTab] = useState<'list' | 'add' | 'bulk'>('list');
    const [editId, setEditId] = useState<number | null>(null);
    
    // Add/Edit Form State
    const [modelName, setModelName] = useState('');
    const [cityId, setCityId] = useState(cities[0]?.id || 0);
    const [status, setStatus] = useState<VehicleStatus>(VehicleStatus.Available);
    
    // Bulk Form State
    const [bulkData, setBulkData] = useState('');

    // Automatically close form if the item being edited is deleted externally or by action
    useEffect(() => {
        if (editId !== null && !vehicles.find(v => v.id === editId)) {
            resetForm();
            setTab('list');
        }
    }, [vehicles, editId]);

    const resetForm = () => {
        setModelName('');
        setCityId(cities[0]?.id || 0);
        setStatus(VehicleStatus.Available);
        setEditId(null);
    };

    const handleEditClick = (v: Vehicle) => {
        setEditId(v.id);
        setModelName(v.modelName);
        setCityId(v.cityId);
        setStatus(v.status);
        setTab('add');
    };

    const handleDelete = (id: number) => {
        if(window.confirm('Are you sure you want to delete this vehicle?')) {
            onDelete(id);
            // useEffect will handle the UI update
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const vehicleData = { modelName, cityId: Number(cityId), status, batteryId: null };
        if (editId !== null) {
            onUpdate({ ...vehicleData, id: editId, batteryId: vehicles.find(v => v.id === editId)?.batteryId || null });
        } else {
            onAdd(vehicleData);
        }
        resetForm();
        setTab('list');
    };

    const handleBulkSubmit = () => {
        const lines = bulkData.trim().split('\n');
        const newVehicles: Omit<Vehicle, 'id'>[] = [];
        
        lines.forEach(line => {
            const [model, city, stat] = line.split(',');
            if (model && city) {
                const foundCity = cities.find(c => c.name.toLowerCase() === city.trim().toLowerCase());
                if (foundCity) {
                    newVehicles.push({
                        modelName: model.trim(),
                        cityId: foundCity.id,
                        status: (stat?.trim() as VehicleStatus) || VehicleStatus.Available,
                        batteryId: null
                    });
                }
            }
        });
        
        if (newVehicles.length > 0) {
            onBulk(newVehicles);
            setBulkData('');
            alert(`Successfully imported ${newVehicles.length} vehicles.`);
            setTab('list');
        } else {
            alert('No valid data found. Check city names and format.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Inventory</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>
                
                <div className="flex space-x-4 mb-4 border-b">
                    <button onClick={() => setTab('list')} className={`pb-2 px-4 ${tab === 'list' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>List / Edit</button>
                    <button onClick={() => { resetForm(); setTab('add'); }} className={`pb-2 px-4 ${tab === 'add' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Add New</button>
                    <button onClick={() => setTab('bulk')} className={`pb-2 px-4 ${tab === 'bulk' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Bulk Upload</button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {tab === 'list' && (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Model</th>
                                    <th className="p-3">City</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map(v => (
                                    <tr key={v.id} className="border-b">
                                        <td className="p-3">{v.id}</td>
                                        <td className="p-3">{v.modelName}</td>
                                        <td className="p-3">{cities.find(c => c.id === v.cityId)?.name}</td>
                                        <td className="p-3">{v.status}</td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleEditClick(v)} className="text-blue-600 hover:underline">Edit</button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); handleDelete(v.id); }} 
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === 'add' && (
                        <form onSubmit={handleSave} className="space-y-4 max-w-lg mx-auto mt-4">
                            <h3 className="font-bold">{editId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                            <div>
                                <label className="block text-sm font-medium">Model Name</label>
                                <input type="text" value={modelName} onChange={e => setModelName(e.target.value)} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <select value={cityId} onChange={e => setCityId(Number(e.target.value))} className="w-full p-2 border rounded" required>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as VehicleStatus)} className="w-full p-2 border rounded">
                                    {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save Vehicle</button>
                                {editId !== null && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(editId);
                                        }} 
                                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                                     >
                                        Delete
                                     </button>
                                )}
                            </div>
                        </form>
                    )}

                    {tab === 'bulk' && (
                        <div className="space-y-4 max-w-2xl mx-auto mt-4">
                            <h3 className="font-bold">Bulk Upload Vehicles</h3>
                            <p className="text-sm text-gray-600">Format: ModelName, CityName, Status (optional)</p>
                            <p className="text-xs text-gray-500">Example: <br/>E-Bike X, San Francisco, Available<br/>Scooter Pro, New York</p>
                            <textarea 
                                value={bulkData} 
                                onChange={e => setBulkData(e.target.value)} 
                                rows={10} 
                                className="w-full p-2 border rounded font-mono text-sm"
                                placeholder="Paste CSV data here..."
                            />
                            <button onClick={handleBulkSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Process Import</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManageBatteriesModal: React.FC<{
    batteries: Battery[];
    cities: City[];
    onClose: () => void;
    onAdd: (b: Omit<Battery, 'id'>) => void;
    onUpdate: (b: Battery) => void;
    onDelete: (id: number) => void;
    onBulk: (b: Omit<Battery, 'id'>[]) => void;
}> = ({ batteries, cities, onClose, onAdd, onUpdate, onDelete, onBulk }) => {
    const [tab, setTab] = useState<'list' | 'add' | 'bulk'>('list');
    const [editId, setEditId] = useState<number | null>(null);
    
    // Form
    const [serialNumber, setSerialNumber] = useState('');
    const [cityId, setCityId] = useState(cities[0]?.id || 0);
    const [chargePercentage, setChargePercentage] = useState(100);
    const [status, setStatus] = useState<BatteryStatus>(BatteryStatus.Available);
    
    // Bulk
    const [bulkData, setBulkData] = useState('');

    // Watch for deletion
    useEffect(() => {
        if (editId !== null && !batteries.find(b => b.id === editId)) {
            resetForm();
            setTab('list');
        }
    }, [batteries, editId]);

    const resetForm = () => {
        setSerialNumber('');
        setCityId(cities[0]?.id || 0);
        setChargePercentage(100);
        setStatus(BatteryStatus.Available);
        setEditId(null);
    };

    const handleEditClick = (b: Battery) => {
        setEditId(b.id);
        setSerialNumber(b.serialNumber);
        setCityId(b.cityId);
        setChargePercentage(b.chargePercentage);
        setStatus(b.status);
        setTab('add');
    };

    const handleDelete = (id: number) => {
         if(window.confirm('Are you sure you want to delete this battery?')) {
            onDelete(id);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { serialNumber, cityId: Number(cityId), chargePercentage: Number(chargePercentage), status, assignedVehicleId: null };
        if (editId !== null) {
            const existing = batteries.find(b => b.id === editId);
            onUpdate({ ...data, id: editId, assignedVehicleId: existing?.assignedVehicleId || null });
        } else {
            onAdd(data);
        }
        resetForm();
        setTab('list');
    };

    const handleBulkSubmit = () => {
        const lines = bulkData.trim().split('\n');
        const newBatteries: Omit<Battery, 'id'>[] = [];
        
        lines.forEach(line => {
            const [sn, city, charge, stat] = line.split(',');
            if (sn && city) {
                const foundCity = cities.find(c => c.name.toLowerCase() === city.trim().toLowerCase());
                if (foundCity) {
                    newBatteries.push({
                        serialNumber: sn.trim(),
                        cityId: foundCity.id,
                        chargePercentage: Number(charge) || 100,
                        status: (stat?.trim() as BatteryStatus) || BatteryStatus.Available,
                        assignedVehicleId: null
                    });
                }
            }
        });
        
        if (newBatteries.length > 0) {
            onBulk(newBatteries);
            setBulkData('');
            alert(`Imported ${newBatteries.length} batteries.`);
            setTab('list');
        } else {
            alert('No valid data.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Batteries</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>
                
                <div className="flex space-x-4 mb-4 border-b">
                    <button onClick={() => setTab('list')} className={`pb-2 px-4 ${tab === 'list' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>List / Edit</button>
                    <button onClick={() => { resetForm(); setTab('add'); }} className={`pb-2 px-4 ${tab === 'add' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Add New</button>
                    <button onClick={() => setTab('bulk')} className={`pb-2 px-4 ${tab === 'bulk' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Bulk Upload</button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {tab === 'list' && (
                        <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3">S/N</th>
                                    <th className="p-3">City</th>
                                    <th className="p-3">Charge</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batteries.map(b => (
                                    <tr key={b.id} className="border-b">
                                        <td className="p-3 font-mono">{b.serialNumber}</td>
                                        <td className="p-3">{cities.find(c => c.id === b.cityId)?.name}</td>
                                        <td className="p-3">{b.chargePercentage}%</td>
                                        <td className="p-3">{b.status}</td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleEditClick(b)} className="text-blue-600 hover:underline">Edit</button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); handleDelete(b.id); }} 
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {tab === 'add' && (
                        <form onSubmit={handleSave} className="space-y-4 max-w-lg mx-auto mt-4">
                            <h3 className="font-bold">{editId ? 'Edit Battery' : 'Add New Battery'}</h3>
                            <div>
                                <label className="block text-sm font-medium">Serial Number</label>
                                <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <select value={cityId} onChange={e => setCityId(Number(e.target.value))} className="w-full p-2 border rounded" required>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Charge %</label>
                                <input type="number" value={chargePercentage} onChange={e => setChargePercentage(Number(e.target.value))} min="0" max="100" className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as BatteryStatus)} className="w-full p-2 border rounded">
                                    {Object.values(BatteryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div className="flex space-x-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save Battery</button>
                                {editId !== null && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(editId);
                                        }} 
                                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                                     >
                                        Delete
                                     </button>
                                )}
                            </div>
                        </form>
                    )}
                    {tab === 'bulk' && (
                        <div className="space-y-4 max-w-2xl mx-auto mt-4">
                            <h3 className="font-bold">Bulk Upload Batteries</h3>
                            <p className="text-sm text-gray-600">Format: SerialNumber, CityName, Charge%, Status (optional)</p>
                            <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} rows={10} className="w-full p-2 border rounded font-mono text-sm" placeholder="Paste CSV data here..."/>
                            <button onClick={handleBulkSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Process Import</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManageRatesModal: React.FC<{
    rates: Rate[];
    cities: City[];
    onClose: () => void;
    onAdd: (r: Omit<Rate, 'id'>) => void;
    onUpdate: (r: Rate) => void;
    onDelete: (id: number) => void;
    onBulk: (r: Omit<Rate, 'id'>[]) => void;
}> = ({ rates, cities, onClose, onAdd, onUpdate, onDelete, onBulk }) => {
    const [tab, setTab] = useState<'list' | 'add' | 'bulk'>('list');
    const [editId, setEditId] = useState<number | null>(null);

    // Form
    const [cityId, setCityId] = useState(cities[0]?.id || 0);
    const [clientName, setClientName] = useState('');
    const [dailyRent, setDailyRent] = useState(0);
    const [monthlyRent, setMonthlyRent] = useState(0);
    const [securityDeposit, setSecurityDeposit] = useState(0);

    // Bulk
    const [bulkData, setBulkData] = useState('');

    // Watch for deletion
    useEffect(() => {
        if (editId !== null && !rates.find(r => r.id === editId)) {
            resetForm();
            setTab('list');
        }
    }, [rates, editId]);

    const resetForm = () => {
        setCityId(cities[0]?.id || 0);
        setClientName('');
        setDailyRent(0);
        setMonthlyRent(0);
        setSecurityDeposit(0);
        setEditId(null);
    };

    const handleEditClick = (r: Rate) => {
        setEditId(r.id);
        setCityId(r.cityId);
        setClientName(r.clientName || '');
        setDailyRent(r.dailyRent);
        setMonthlyRent(r.monthlyRent || 0);
        setSecurityDeposit(r.securityDeposit);
        setTab('add');
    };

    const handleDelete = (id: number) => {
        if(window.confirm('Are you sure you want to delete this rate?')) {
            onDelete(id);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { 
            cityId: Number(cityId), 
            clientName: clientName || undefined, 
            dailyRent: Number(dailyRent), 
            monthlyRent: Number(monthlyRent) || undefined, 
            securityDeposit: Number(securityDeposit) 
        };
        if (editId !== null) {
            onUpdate({ ...data, id: editId });
        } else {
            onAdd(data);
        }
        resetForm();
        setTab('list');
    };

    const handleBulkSubmit = () => {
        const lines = bulkData.trim().split('\n');
        const newRates: Omit<Rate, 'id'>[] = [];
        
        lines.forEach(line => {
            const [city, daily, monthly, security, client] = line.split(',');
            if (city && daily) {
                const foundCity = cities.find(c => c.name.toLowerCase() === city.trim().toLowerCase());
                if (foundCity) {
                    newRates.push({
                        cityId: foundCity.id,
                        dailyRent: Number(daily),
                        monthlyRent: Number(monthly) || undefined,
                        securityDeposit: Number(security) || 0,
                        clientName: client?.trim() || undefined
                    });
                }
            }
        });

        if (newRates.length > 0) {
            onBulk(newRates);
            setBulkData('');
            alert(`Imported ${newRates.length} rates.`);
            setTab('list');
        } else {
            alert('No valid data.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Rates</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>
                
                 <div className="flex space-x-4 mb-4 border-b">
                    <button onClick={() => setTab('list')} className={`pb-2 px-4 ${tab === 'list' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>List / Edit</button>
                    <button onClick={() => { resetForm(); setTab('add'); }} className={`pb-2 px-4 ${tab === 'add' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Add New</button>
                    <button onClick={() => setTab('bulk')} className={`pb-2 px-4 ${tab === 'bulk' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>Bulk Upload</button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {tab === 'list' && (
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3">City</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Daily</th>
                                    <th className="p-3">Monthly</th>
                                    <th className="p-3">Security</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rates.map(r => (
                                    <tr key={r.id} className="border-b">
                                        <td className="p-3">{cities.find(c => c.id === r.cityId)?.name}</td>
                                        <td className="p-3">{r.clientName || 'Standard'}</td>
                                        <td className="p-3">₹{r.dailyRent}</td>
                                        <td className="p-3">{r.monthlyRent ? `₹${r.monthlyRent}` : '-'}</td>
                                        <td className="p-3">₹{r.securityDeposit}</td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleEditClick(r)} className="text-blue-600 hover:underline">Edit</button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); handleDelete(r.id); }} 
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {tab === 'add' && (
                        <form onSubmit={handleSave} className="space-y-4 max-w-lg mx-auto mt-4">
                            <h3 className="font-bold">{editId ? 'Edit Rate' : 'Add New Rate'}</h3>
                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <select value={cityId} onChange={e => setCityId(Number(e.target.value))} className="w-full p-2 border rounded" required>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Client Name (Optional)</label>
                                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 border rounded" placeholder="Leave empty for standard rate" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Daily Rent</label>
                                    <input type="number" value={dailyRent} onChange={e => setDailyRent(Number(e.target.value))} className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Monthly Rent</label>
                                    <input type="number" value={monthlyRent} onChange={e => setMonthlyRent(Number(e.target.value))} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Security Deposit</label>
                                <input type="number" value={securityDeposit} onChange={e => setSecurityDeposit(Number(e.target.value))} className="w-full p-2 border rounded" required />
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save Rate</button>
                                {editId !== null && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(editId);
                                        }} 
                                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                                     >
                                        Delete
                                     </button>
                                )}
                            </div>
                        </form>
                    )}
                    {tab === 'bulk' && (
                        <div className="space-y-4 max-w-2xl mx-auto mt-4">
                            <h3 className="font-bold">Bulk Upload Rates</h3>
                            <p className="text-sm text-gray-600">Format: CityName, Daily, Monthly, Security, ClientName (optional)</p>
                            <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} rows={10} className="w-full p-2 border rounded font-mono text-sm" placeholder="Paste CSV data here..."/>
                            <button onClick={handleBulkSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Process Import</button>
                        </div>
                    )}
                </div>
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

const CustomerDetailsModal: React.FC<{
    customer: { name: string; phone: string; bookings: Booking[] };
    vehicles: Vehicle[];
    onClose: () => void;
}> = ({ customer, vehicles, onClose }) => {
    const getVehicleModel = (id: number) => vehicles.find(v => v.id === id)?.modelName || 'Unknown';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                     <div>
                        <h2 className="text-xl font-bold">{customer.name}</h2>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                     </div>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </button>
                </div>
                
                <div className="overflow-y-auto flex-grow">
                    {customer.bookings.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No bookings found.</p>
                    ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Vehicle</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Collected</th>
                                <th className="p-3">Pending</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.bookings.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(booking => {
                                const totalPayable = booking.totalRent + booking.securityDeposit + (booking.fineAmount || 0);
                                const pending = Math.max(0, totalPayable - booking.amountCollected);
                                return (
                                <tr key={booking.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">#{booking.id}</td>
                                    <td className="p-3">{getVehicleModel(booking.vehicleId)}</td>
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                                            <span className="text-gray-400 text-xs">to</span>
                                            <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 font-medium text-green-600">
                                        <div>₹{booking.amountCollected}</div>
                                        <div className="text-xs text-gray-400">Total: ₹{totalPayable}</div>
                                    </td>
                                    <td className="p-3 font-medium text-red-600">{pending > 0 ? `₹${pending}` : '-'}</td>
                                    <td className="p-3"><BookingStatusBadge status={booking.status} /></td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    )}
                </div>
                
                <div className="mt-4 pt-2 border-t flex justify-end">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Close</button>
                </div>
            </div>
        </div>
    );
};

const CitiesSection: React.FC<{
    cities: City[];
    onAdd: (name: string, address: string) => void;
    onUpdate: (id: number, name: string, address: string) => void;
}> = ({ cities, onAdd, onUpdate }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    const handleEdit = (c: City) => {
        setEditingId(c.id);
        setName(c.name);
        setAddress(c.zapPointAddress || '');
    };

    const handleSave = () => {
        if (editingId) {
            onUpdate(editingId, name, address);
            setEditingId(null);
        } else {
            onAdd(name, address);
        }
        setName('');
        setAddress('');
    };

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">City Management</h3>
            <div className="mb-4 bg-white p-4 rounded-lg shadow space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Enter city name"
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Zap Point Address</label>
                        <input 
                            type="text" 
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            placeholder="e.g. Patrapada, bhubaneswar, 751002"
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleSave} 
                        disabled={!name}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {editingId ? 'Update City' : 'Add City'}
                    </button>
                    {editingId && (
                        <button onClick={() => { setEditingId(null); setName(''); setAddress(''); }} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Zap Point Address</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cities.map(c => (
                            <tr key={c.id} className="border-b">
                                <td className="p-3">{c.id}</td>
                                <td className="p-3 font-medium">{c.name}</td>
                                <td className="p-3 text-gray-600">{c.zapPointAddress || '-'}</td>
                                <td className="p-3">
                                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:underline text-xs">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{
  rates: Rate[];
  vehicles: Vehicle[];
  users: User[];
  cities: City[];
  bookings: Booking[];
  batteries: Battery[];
  refundRequests: RefundRequest[];

  // CRUD & Bulk Ops
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: number) => void;
  bulkImportVehicles: (v: Omit<Vehicle, 'id'>[]) => void;

  addBattery: (b: Omit<Battery, 'id'>) => void;
  updateBattery: (b: Battery) => void;
  deleteBattery: (id: number) => void;
  bulkImportBatteries: (b: Omit<Battery, 'id'>[]) => void;

  addRate: (r: Omit<Rate, 'id'>) => void;
  updateRate: (r: Rate) => void;
  deleteRate: (id: number) => void;
  bulkImportRates: (r: Omit<Rate, 'id'>[]) => void;

  addCity: (name: string, address: string) => void;
  updateCity: (id: number, name: string, address: string) => void;
  processRefundRequest: (requestId: number) => void;
}> = (props) => {
  const { 
      rates, vehicles, users, cities, bookings, batteries, refundRequests, 
      addVehicle, updateVehicle, deleteVehicle, bulkImportVehicles,
      addBattery, updateBattery, deleteBattery, bulkImportBatteries,
      addRate, updateRate, deleteRate, bulkImportRates,
      addCity, updateCity, processRefundRequest 
  } = props;

  const [activeSection, setActiveSection] = useState<AdminSection>('reports');
  const [viewingCustomer, setViewingCustomer] = useState<{ name: string; phone: string; bookings: Booking[] } | null>(null);
  
  // Management Modals
  const [showManageVehicles, setShowManageVehicles] = useState(false);
  const [showManageBatteries, setShowManageBatteries] = useState(false);
  const [showManageRates, setShowManageRates] = useState(false);

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
        end.setHours(23, 59, 59, 999);

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
            
            const days = calculateDays(b.startDate, b.endDate);
            const rent = b.totalRent ?? (days * b.dailyRent);
            potentialRent += rent;
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
                    <p className="text-3xl font-bold">₹{rentCollected}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Security Collected</p>
                    <p className="text-3xl font-bold">₹{securityCollected}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-500">Pending Rent</p>
                    <p className="text-3xl font-bold">₹{pendingRent}</p>
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
                            const days = calculateDays(b.startDate, b.endDate);
                            const totalRent = b.totalRent ?? (days * b.dailyRent);
                            const pending = totalRent - b.amountCollected;
                            return (
                                <tr key={b.id} className="border-b">
                                    <td className="p-3">
                                        <div className="font-medium">{b.customerName}</div>
                                        <div className="text-xs text-gray-500">{b.customerPhone}</div>
                                    </td>
                                    <td className="p-3">{getVehicleModel(b.vehicleId)}</td>
                                    <td className="p-3">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">₹{totalRent}</td>
                                    <td className="p-3 text-green-600">₹{b.amountCollected}</td>
                                    <td className="p-3 text-red-600">₹{pending > 0 ? pending : 0}</td>
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
        <button 
            onClick={() => setShowManageVehicles(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
            <BikeIcon className="w-4 h-4" />
            <span>Edit Inventory</span>
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
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-3">{v.id}</td>
                <td className="p-3 font-medium">{v.modelName}</td>
                <td className="p-3">{cities.find(c => c.id === v.cityId)?.name}</td>
                <td className="p-3">{batteries.find(b => b.id === v.batteryId)?.serialNumber || 'N/A'}</td>
                <td className="p-3"><VehicleStatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const BatteriesSection = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Battery Management</h3>
        <button 
            onClick={() => setShowManageBatteries(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
            <BoltIcon className="w-4 h-4" />
            <span>Edit Batteries</span>
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
        <button 
            onClick={() => setShowManageRates(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
            <MoneyIcon className="w-4 h-4" />
            <span>Edit Rates</span>
        </button>
      </div>
       <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Daily Rent</th>
              <th className="p-3 text-left">Monthly Rent</th>
              <th className="p-3 text-left">Security Deposit</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-3 font-medium">{cities.find(c => c.id === r.cityId)?.name}</td>
                <td className="p-3">{r.clientName || 'Standard'}</td>
                <td className="p-3">₹{r.dailyRent}</td>
                <td className="p-3">{r.monthlyRent ? `₹${r.monthlyRent}` : '-'}</td>
                <td className="p-3">₹{r.securityDeposit}</td>
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

  const RefundsSection = () => (
      <div>
        <h3 className="text-xl font-bold mb-4">Refund Requests</h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Booking ID</th>
                        <th className="p-3 text-left">Customer</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {refundRequests.map(request => (
                        <tr key={request.id} className="border-b">
                            <td className="p-3">{new Date(request.date).toLocaleDateString()}</td>
                            <td className="p-3">#{request.bookingId}</td>
                            <td className="p-3">{request.customerName}</td>
                            <td className="p-3 font-bold text-red-600">₹{request.amount}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {request.status}
                                </span>
                            </td>
                            <td className="p-3">
                                {request.status === 'Pending' && (
                                    <button 
                                        onClick={() => processRefundRequest(request.id)}
                                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-xs font-bold"
                                    >
                                        Mark Processed
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {refundRequests.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center p-4 text-gray-500">No active refund requests.</td>
                        </tr>
                    )}
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
                const rent = b.totalRent ?? (days * b.dailyRent);
                totalPotentialRent += rent;
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
                rawBookings: data.bookings,
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
                <th className="p-3 text-left">Actions</th>
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
                  <td className="p-3 font-medium text-green-600">₹{customer.totalRentCollected.toFixed(2)}</td>
                  <td className="p-3 font-medium">₹{customer.totalSecurityCollected.toFixed(2)}</td>
                  <td className="p-3 font-medium text-red-600">₹{customer.pendingRent.toFixed(2)}</td>
                  <td className="p-3">{new Date(customer.lastBookingDate).toLocaleDateString()}</td>
                  <td className="p-3">
                     <button 
                        onClick={() => setViewingCustomer({ 
                            name: customer.name, 
                            phone: customer.phone, 
                            bookings: customer.rawBookings 
                        })}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-200"
                    >
                        View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const PendingPaymentsSection = () => {
      const pendingBookings = useMemo(() => {
          return bookings.filter(b => {
              const days = calculateDays(b.startDate, b.endDate);
              const totalRent = b.totalRent ?? (days * b.dailyRent);
              const totalPayable = b.status === BookingStatus.Returned 
                 ? totalRent + (b.fineAmount || 0) 
                 : totalRent + b.securityDeposit + (b.fineAmount || 0);
              const pending = totalPayable - b.amountCollected;
              return pending > 0;
          }).map(b => {
              const daysOverdue = getDaysOverdue(b);
              const totalRent = b.totalRent ?? (calculateDays(b.startDate, b.endDate) * b.dailyRent);
               const totalPayable = b.status === BookingStatus.Returned 
                 ? totalRent + (b.fineAmount || 0) 
                 : totalRent + b.securityDeposit + (b.fineAmount || 0);
              return { ...b, pendingAmount: totalPayable - b.amountCollected, daysOverdue };
          }).sort((a,b) => b.daysOverdue - a.daysOverdue);
      }, [bookings]);

      const getVehicleModel = (id: number) => vehicles.find(v => v.id === id)?.modelName || 'Unknown';

      return (
          <div>
            <h3 className="text-xl font-bold mb-4">Pending Payments</h3>
             <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Booking ID</th>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-left">Vehicle</th>
                            <th className="p-3 text-left">Pending Amount</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Overdue Status</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingBookings.map(b => (
                            <tr key={b.id} className={`border-b ${b.daysOverdue > 7 ? 'bg-red-50' : ''}`}>
                                <td className="p-3">#{b.id}</td>
                                <td className="p-3">
                                    <div className="font-medium">{b.customerName}</div>
                                    <div className="text-xs text-gray-500">{b.customerPhone}</div>
                                </td>
                                <td className="p-3">{getVehicleModel(b.vehicleId)}</td>
                                <td className="p-3 font-bold text-red-600">₹{b.pendingAmount}</td>
                                <td className="p-3"><BookingStatusBadge status={b.status} /></td>
                                <td className="p-3">
                                    {b.daysOverdue > 7 ? (
                                        <span className="text-red-700 font-bold flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Overdue {b.daysOverdue} days
                                        </span>
                                    ) : (
                                        <span className="text-yellow-700 font-medium">Overdue {b.daysOverdue} days</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <button 
                                        onClick={() => {
                                            const customerBookings = bookings.filter(booking => booking.customerPhone === b.customerPhone);
                                            setViewingCustomer({ name: b.customerName, phone: b.customerPhone, bookings: customerBookings });
                                        }}
                                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-200"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {pendingBookings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center p-4 text-gray-500">No pending payments found.</td>
                            </tr>
                        )}
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
        <SectionButton section="cities" label="Cities" icon={<ArrowPathIcon className="w-5 h-5"/>} />
        <SectionButton section="refunds" label="Refunds" icon={<ArrowPathIcon className="w-5 h-5"/>} />
        <SectionButton section="pending-payments" label="Pending Pay" icon={<MoneyIcon className="w-5 h-5 text-red-500"/>} />
        <SectionButton section="users" label="Users" icon={<UserIcon className="w-5 h-5"/>} />
        <SectionButton section="customers" label="Customers" icon={<UserGroupIcon className="w-5 h-5"/>} />
      </nav>
      <main className="flex-1 p-4 md:p-6 bg-gray-50">
        {activeSection === 'reports' && <ReportsSection />}
        {activeSection === 'inventory' && <InventorySection />}
        {activeSection === 'batteries' && <BatteriesSection />}
        {activeSection === 'rates' && <RatesSection />}
        {activeSection === 'cities' && <CitiesSection cities={cities} onAdd={addCity} onUpdate={updateCity} />}
        {activeSection === 'users' && <UsersSection />}
        {activeSection === 'customers' && <CustomersSection />}
        {activeSection === 'refunds' && <RefundsSection />}
        {activeSection === 'pending-payments' && <PendingPaymentsSection />}
      </main>
       {viewingCustomer && (
            <CustomerDetailsModal 
                customer={viewingCustomer} 
                vehicles={vehicles} 
                onClose={() => setViewingCustomer(null)} 
            />
        )}
        
        {showManageVehicles && (
            <ManageVehiclesModal
                vehicles={vehicles}
                cities={cities}
                batteries={batteries}
                onClose={() => setShowManageVehicles(false)}
                onAdd={addVehicle}
                onUpdate={updateVehicle}
                onDelete={deleteVehicle}
                onBulk={bulkImportVehicles}
            />
        )}

        {showManageBatteries && (
            <ManageBatteriesModal
                batteries={batteries}
                cities={cities}
                onClose={() => setShowManageBatteries(false)}
                onAdd={addBattery}
                onUpdate={updateBattery}
                onDelete={deleteBattery}
                onBulk={bulkImportBatteries}
            />
        )}

        {showManageRates && (
            <ManageRatesModal
                rates={rates}
                cities={cities}
                onClose={() => setShowManageRates(false)}
                onAdd={addRate}
                onUpdate={updateRate}
                onDelete={deleteRate}
                onBulk={bulkImportRates}
            />
        )}
    </div>
  );
};

export default AdminPanel;
