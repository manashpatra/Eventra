import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Box, Typography, Alert, Snackbar, Tabs, Tab,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon, Fastfood as FoodIcon, CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  Security as SecurityIcon, AccountBalanceWallet as ExpenseIcon,
  Groups as GroupsIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import { getMasterConfig, updateMasterConfig } from '../../services/masterConfigService';
import { DEFAULT_DPC_MEMBERS } from '../../services/publicDataService';
import { getAllResidents } from '../../services/residentService';
import { v4 as uuidv4 } from 'uuid';
import { createSecondaryAuthUser, firestoreBatchWrite, COLLECTIONS } from '../../services/firebase';
import ConfirmDialog from '../../components/ConfirmDialog';
import SleekLoader from '../../components/SleekLoader';
import { useAuth } from '../../contexts/AuthContext';
import { brand, border } from '../../theme/colorTokens';

const ExpenseCategoriesTab = lazy(() => import('./MasterSettingsTabs/ExpenseCategoriesTab'));
const MealPricingTab = lazy(() => import('./MasterSettingsTabs/MealPricingTab'));
const UserAccessTab = lazy(() => import('./MasterSettingsTabs/UserAccessTab'));
const CommitteeDirectoryTab = lazy(() => import('./MasterSettingsTabs/CommitteeDirectoryTab'));
const GeneralTab = lazy(() => import('./MasterSettingsTabs/GeneralTab'));
const PujaDaysTab = lazy(() => import('./MasterSettingsTabs/PujaDaysTab'));
const ResidentsDataTab = lazy(() => import('./MasterSettingsTabs/ResidentsDataTab'));
const SocietyDirectoryTab = lazy(() => import('./MasterSettingsTabs/SocietyDirectoryTab'));


const MasterSettings = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const TAB_MAP = {
    expenses: 0,
    meals: 1,
    roles: 2,
    dpc: 3,
    general: 4,
    puja: 5,
    residents: 6,
    society: 7,
  };

  const TAB_REVERSE_MAP = {
    0: 'expenses',
    1: 'meals',
    2: 'roles',
    3: 'dpc',
    4: 'general',
    5: 'puja',
    6: 'residents',
    7: 'society',
  };

  const activeTab = isSuperAdmin
    ? (TAB_MAP[searchParams.get('tab')] !== undefined ? TAB_MAP[searchParams.get('tab')] : 0)
    : 0;

  const setActiveTab = (id) => {
    if (isSuperAdmin) {
      setSearchParams({ tab: TAB_REVERSE_MAP[id] });
    }
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [newUserRole, setNewUserRole] = useState({ email: '', password: '', role: 'FoodCoupon', fullName: '', isActive: true, isEditing: false });

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [existingResidents, setExistingResidents] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dpcEditIndex, setDpcEditIndex] = useState(-1);
  const [dpcForm, setDpcForm] = useState({ role: '', name: '', flatNumber: '', phone: '', icon: 'crown' });
  const [societyEditIndex, setSocietyEditIndex] = useState(-1);
  const [societyForm, setSocietyForm] = useState({ roleTemplate: 'Facility Manager', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' });

  const loadData = async () => {
    try {
      if (isSuperAdmin) {
        const [configData, residents] = await Promise.all([
          getMasterConfig(),
          getAllResidents(),
        ]);
        // Ensure dpcMembers exists in config
        if (!configData.dpcMembers) {
          configData.dpcMembers = DEFAULT_DPC_MEMBERS;
        }
        // Ensure societyContacts exists in config
        if (!configData.societyContacts) {
          configData.societyContacts = [
            { id: '1', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' },
            { id: '2', role: 'Support', name: '', phone: '', email: '', icon: 'support' },
            { id: '3', role: 'Technical Manager', name: '', phone: '', email: '', icon: 'technical' },
            { id: '4', role: 'Civil Manager', name: '', phone: '', email: '', icon: 'civil' },
            { id: '5', role: 'House Keeping', name: '', phone: '', email: '', icon: 'housekeeping' },
            { id: '6', role: 'Site Incharge', name: '', phone: '', email: '', icon: 'incharge' }
          ];
        }
        setConfig({ ...configData });
        setExistingResidents(residents);
      } else {
        setConfig({ dummy: true });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, isSuperAdmin]);

  const saveSectionConfig = async (sectionName) => {
    try {
      await updateMasterConfig(config);
      setSnackbar({ open: true, message: `${sectionName} saved successfully!`, severity: 'success' });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: `Error saving ${sectionName}`, severity: 'error' });
    }
  };

  const updateMealPrice = (dayIndex, meal, foodType, field, value) => {
    setConfig(prev => {
      const newDays = [...prev.foodDays];
      // Ensure mealPrices structure exists for safety
      if (!newDays[dayIndex].mealPrices) {
        newDays[dayIndex].mealPrices = {
          Breakfast: { Veg: { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true }, 'Non-Veg': { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true } },
          Lunch: { Veg: { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true }, 'Non-Veg': { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true } },
          Dinner: { Veg: { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true }, 'Non-Veg': { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true } },
        };
      }
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        mealPrices: {
          ...newDays[dayIndex].mealPrices,
          [meal]: {
            ...newDays[dayIndex].mealPrices[meal],
            [foodType]: {
              ...(newDays[dayIndex].mealPrices[meal]?.[foodType] || {}),
              [field]: field === 'menu' ? value : field === 'parcelEnabled' ? value : (Number(value) || 0),
            },
          },
        },
      };
      return { ...prev, foodDays: newDays };
    });
  };

  const updateMealVegOnly = (dayIndex, meal, value) => {
    setConfig(prev => {
      const newDays = [...prev.foodDays];
      if (!newDays[dayIndex].mealPrices) return prev;
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        mealPrices: {
          ...newDays[dayIndex].mealPrices,
          [meal]: {
            ...newDays[dayIndex].mealPrices[meal],
            vegOnly: value,
          },
        },
      };
      return { ...prev, foodDays: newDays };
    });
  };

  const updateMealSplitVeg = (dayIndex, meal, value) => {
    setConfig(prev => {
      const newDays = [...prev.foodDays];
      if (!newDays[dayIndex].mealPrices) return prev;
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        mealPrices: {
          ...newDays[dayIndex].mealPrices,
          [meal]: {
            ...newDays[dayIndex].mealPrices[meal],
            splitVeg: value,
          },
        },
      };
      return { ...prev, foodDays: newDays };
    });
  };

  const updateMealSplitNonVeg = (dayIndex, meal, value) => {
    setConfig(prev => {
      const newDays = [...prev.foodDays];
      if (!newDays[dayIndex].mealPrices) return prev;
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        mealPrices: {
          ...newDays[dayIndex].mealPrices,
          [meal]: {
            ...newDays[dayIndex].mealPrices[meal],
            splitNonVeg: value,
          },
        },
      };
      return { ...prev, foodDays: newDays };
    });
  };
  const updateMealEnabled = (dayIndex, meal, value) => {
    setConfig(prev => {
      const newDays = [...prev.foodDays];
      if (!newDays[dayIndex].mealPrices) return prev;
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        mealPrices: {
          ...newDays[dayIndex].mealPrices,
          [meal]: {
            ...newDays[dayIndex].mealPrices[meal],
            enabled: value,
          },
        },
      };
      return { ...prev, foodDays: newDays };
    });
  };

  const updateFoodDay = (index, field, value) => {
    setConfig(prev => {
      const days = [...prev.foodDays];
      days[index] = { ...days[index], [field]: value };
      return { ...prev, foodDays: days };
    });
  };

  const addFoodDay = () => {
    setConfig(prev => ({
      ...prev,
      foodDays: [...prev.foodDays, { dayName: '', date: '', enabled: true }],
    }));
  };

  const removeFoodDay = (index) => {
    setConfig(prev => ({
      ...prev,
      foodDays: prev.foodDays.filter((_, i) => i !== index),
    }));
  };

  const addUserRole = async () => {
    if (!newUserRole.email) return;

    const existingIndex = (config.userRoles || []).findIndex(ur => ur.email.toLowerCase() === newUserRole.email.toLowerCase());

    if (newUserRole.password) {
      try {
        await createSecondaryAuthUser(newUserRole.email, newUserRole.password);
        setSnackbar({ open: true, message: 'User created/updated in Firebase successfully!', severity: 'success' });
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          setSnackbar({ open: true, message: 'User already exists in Firebase. Updating locally.', severity: 'info' });
        } else if (error.code) {
          setSnackbar({ open: true, message: 'Firebase Error: ' + error.message, severity: 'error' });
          return;
        }
      }
    } else if (!newUserRole.isEditing) {
       // New user MUST have a password
       setSnackbar({ open: true, message: 'Password is required for new users', severity: 'warning' });
       return;
    }

    const { password: _pwd, isEditing: _isEditing, ...roleWithoutPassword } = newUserRole;
    
    let updatedRoles = [...(config.userRoles || [])];
    if (existingIndex >= 0) {
      updatedRoles[existingIndex] = { ...updatedRoles[existingIndex], ...roleWithoutPassword };
    } else {
      updatedRoles.push({ ...roleWithoutPassword });
    }
    
    const updatedConfig = { ...config, userRoles: updatedRoles };
    setConfig(updatedConfig);
    setNewUserRole({ email: '', password: '', role: 'FoodCoupon', fullName: '', isActive: true, isEditing: false });

    try {
      await updateMasterConfig(updatedConfig);
    } catch (e) {
      console.error(e);
    }
  };

  const editUserRole = (ur) => {
    setNewUserRole({
      email: ur.email,
      password: '',
      role: ur.role || 'Standard',
      fullName: ur.fullName || '',
      isActive: ur.isActive !== false,
      isEditing: true
    });
  };

  const removeUserRole = (email) => {
    setConfirmDialog({
      open: true,
      title: 'Remove User Access',
      message: `Are you sure you want to remove access for ${email}? They will no longer be able to log in with these credentials.`,
      onConfirm: async () => {
        const updatedRoles = config.userRoles.filter(ur => ur.email !== email);
        const updatedConfig = { ...config, userRoles: updatedRoles };
        setConfig(updatedConfig);

        try {
          await updateMasterConfig(updatedConfig);
        } catch (e) {
          console.error(e);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const toggleUserStatus = (email) => {
    const updatedRoles = config.userRoles.map(ur => {
      if (ur.email === email) {
        return { ...ur, isActive: ur.isActive === false ? true : false };
      }
      return ur;
    });
    const updatedConfig = { ...config, userRoles: updatedRoles };
    setConfig(updatedConfig);
    
    updateMasterConfig(updatedConfig).catch(console.error);
  };

  // Master data import - parse text with format: Name, Block, Floor, Type (one per line)
  const handleImportMasterData = async () => {
    try {
      const lines = importText.trim().split('\n').filter(l => l.trim());
      const newResidents = [];
      let skipped = 0;

      for (const line of lines) {
        // Support multiple formats:
        // "Name, Block, Floor, Type" or "Name\tBlock\tFloor\tType"
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length < 4) { skipped++; continue; }

        const name = parts[0].trim();
        const block = parseInt(parts[1].trim());
        const floor = parseInt(parts[2].trim());
        const flatType = parts[3].trim().toUpperCase();

        if (!name || isNaN(block) || isNaN(floor) || !flatType) { skipped++; continue; }

        const flatNumber = `${block}-${floor}-${flatType}`;

        // Skip if already exists
        const exists = existingResidents.some(r => r.flatNumber === flatNumber);
        if (exists) { skipped++; continue; }

        newResidents.push({
          id: uuidv4(),
          name,
          mobile: parts[4]?.trim() || '',
          email: parts[5]?.trim() || '',
          block,
          floor,
          flatType,
          flatNumber,
          subscriptionStatus: 'pending',
          subscriptionAmount: 0,
          paymentDate: null,
          paymentMode: null,
          paymentProofUrl: null,
          remarks: '',
          createdAt: new Date().toISOString(),
        });
      }

      if (newResidents.length > 0) {
        const operations = newResidents.map((r) => ({
          type: 'set',
          collectionName: COLLECTIONS.RESIDENTS,
          id: r.id,
          data: r,
        }));
        await firestoreBatchWrite(operations);
      }

      setSnackbar({
        open: true,
        message: `Imported ${newResidents.length} residents. ${skipped > 0 ? `${skipped} skipped (duplicate or invalid).` : ''}`,
        severity: 'success',
      });
      setImportDialogOpen(false);
      setImportText('');
      await loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Import error: ' + error.message, severity: 'error' });
    }
  };

  const sanitizeCsvCell = (value) => {
    let str = (value ?? '').toString();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes('"')) {
      str = str.replace(/"/g, '""');
    }
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      str = `"${str}"`;
    }
    return str;
  };

  // Export master data
  const handleExportData = () => {
    const csv = existingResidents.map(r =>
      `${sanitizeCsvCell(r.name)},${sanitizeCsvCell(r.block)},${sanitizeCsvCell(r.floor)},${sanitizeCsvCell(r.flatType)},${sanitizeCsvCell(r.mobile || '')},${sanitizeCsvCell(r.email || '')},${sanitizeCsvCell(r.subscriptionStatus)}`
    ).join('\n');
    const header = 'Name,Block,Floor,Type,Mobile,Email,Status\n';
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'residents_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };



  if (loading || !config) return <SleekLoader message="Loading Master Settings..." />;

  return (
    <Box>
      {/* Top Settings Tabs */}
      {isSuperAdmin && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`,
              '& .MuiTabs-indicator': {
                backgroundColor: brand.orange,
              },
              '& .MuiTab-root': {
                color: 'text.secondary',
                fontSize: '0.85rem',
                fontWeight: 500,
                minHeight: 48,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: brand.orange,
                  fontWeight: 600,
                },
              },
            }}
          >
            <Tab icon={<ExpenseIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Expense Categories" />
            <Tab icon={<FoodIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Meal Pricing" />
            <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="User Access" />
            <Tab icon={<GroupsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Committee Directory" />
            <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="General Settings" />
            <Tab icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Puja Days" />
            <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Residents Data" />
            <Tab icon={<ContactIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Society Directory" />
          </Tabs>
        </Box>
      )}

      {/* Main Settings Content */}
      <Box sx={{ width: '100%' }}>
        <Suspense fallback={<SleekLoader message="Loading tab..." />}>
          {/* General Tab */}
          {activeTab === 4 && (
            <GeneralTab config={config} setConfig={setConfig} saveSectionConfig={saveSectionConfig} />
          )}

          {/* Puja Days Tab */}
          {activeTab === 5 && (
            <PujaDaysTab config={config} setConfig={setConfig} addFoodDay={addFoodDay} updateFoodDay={updateFoodDay} removeFoodDay={removeFoodDay} saveSectionConfig={saveSectionConfig} />
          )}

          {/* Meal Pricing Tab */}
          {activeTab === 1 && (
            <MealPricingTab config={config} selectedDayIndex={selectedDayIndex} setSelectedDayIndex={setSelectedDayIndex} updateMealEnabled={updateMealEnabled} updateMealVegOnly={updateMealVegOnly} updateMealSplitVeg={updateMealSplitVeg} updateMealSplitNonVeg={updateMealSplitNonVeg} updateMealPrice={updateMealPrice} saveSectionConfig={saveSectionConfig} />
          )}

          {/* Master Data Tab */}
          {activeTab === 6 && (
            <ResidentsDataTab
              existingResidents={existingResidents}
              setImportDialogOpen={setImportDialogOpen}
              handleExportData={handleExportData}
              importDialogOpen={importDialogOpen}
              importText={importText}
              setImportText={setImportText}
              handleImportMasterData={handleImportMasterData}
              onResidentAdded={loadData}
              config={config}
            />
          )}

          {/* User Roles Tab */}
          {activeTab === 2 && (
            <UserAccessTab config={config} newUserRole={newUserRole} setNewUserRole={setNewUserRole} addUserRole={addUserRole} removeUserRole={removeUserRole} toggleUserStatus={toggleUserStatus} editUserRole={editUserRole} />
          )}

          {/* Expense Categories Tab */}
          {activeTab === 0 && (
            <ExpenseCategoriesTab config={config} setConfig={setConfig} saveSectionConfig={saveSectionConfig} />
          )}

          {/* DPC Committee Tab */}
          {activeTab === 3 && (
            <CommitteeDirectoryTab config={config} setConfig={setConfig} saveSectionConfig={saveSectionConfig} />
          )}

          {/* Society Directory Tab */}
          {activeTab === 7 && (
            <SocietyDirectoryTab config={config} setConfig={setConfig} saveSectionConfig={saveSectionConfig} />
          )}
        </Suspense>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default MasterSettings;
