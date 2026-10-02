import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';
import { Event as EventIcon, AddCircle as AddCircleIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { 
  getAllCulturalEvents, 
  createCulturalEvent, 
  updateCulturalEvent, 
  deleteCulturalEvent,
  getApplicationsByEvent
} from '../../../services/culturalService';
import { getMasterConfig } from '../../../services/masterConfigService';
import SleekLoader from '../../../components/SleekLoader';
import ConfirmDialog from '../../../components/ConfirmDialog';
import CulturalDashboard from './CulturalDashboard';
import EventsListTab from './EventsListTab';
import AddEditEventTab from './AddEditEventTab';
import ApplicationsDialog from './ApplicationsDialog';

const TAB_ROUTES = ['/manage-events', '/manage-events/add', '/manage-events/dashboard'];

const CulturalPrograms = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname === '/manage-events/add' ? 1
    : location.pathname === '/manage-events/dashboard' || location.pathname === '/cultural/dashboard' ? 2
    : 0;

  const handleTabChange = (event, newValue) => {
    navigate(TAB_ROUTES[newValue]);
  };

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState(null);

  // Form State
  const [editIndex, setEditIndex] = useState(-1);
  
  const [appDialog, setAppDialog] = useState({ open: false, event: null, applications: [] });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const openApplications = async (ev) => {
    try {
      const apps = await getApplicationsByEvent(ev.id);
      setAppDialog({ open: true, event: ev, applications: apps });
    } catch (e) {
      showSnackbar('Failed to load applications', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rawEvents, cfg] = await Promise.all([
        getAllCulturalEvents(),
        getMasterConfig()
      ]);
      
      // Force sync application counts to ensure maxItems multiplier is accurate
      const eventsData = await Promise.all(rawEvents.map(async (ev) => {
        try {
          const apps = await getApplicationsByEvent(ev.id);
          const total = apps.reduce((sum, app) => {
             const consumed = ev.maxItems > 0 ? (Number(app.itemCount) || 1) : 1;
             return sum + consumed;
          }, 0);
          
          if (ev.applicationCount !== total) {
            const updates = { applicationCount: total };
            await updateCulturalEvent(ev.id, updates);
            return { ...ev, ...updates };
          }
        } catch (err) {
          console.error('Failed to sync event counts for', ev.id, err);
        }
        return ev;
      }));

      setEvents(eventsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setConfig(cfg);
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleSaveEvent = async (formData) => {
    try {
      const subEventsList = formData.subEventsText ? formData.subEventsText.split('\n').map(s => s.trim()).filter(s => s) : [];
      const cleanCustomFields = formData.customFields.filter(cf => cf.label.trim());
      
      if (editIndex >= 0) {
        const id = events[editIndex].id;
        const updated = await updateCulturalEvent(id, {
          title: formData.title,
          description: formData.description,
          eventDate: formData.eventDate ? formData.eventDate.toISOString() : null,
          eventEndDate: formData.eventEndDate ? formData.eventEndDate.toISOString() : null,
          isTentative: formData.isTentative,
          lastDateToApply: formData.lastDateToApply ? formData.lastDateToApply.toISOString() : null,
          active: formData.active,
          subEvents: subEventsList,
          customFields: cleanCustomFields,
          allowGroupRegistration: formData.allowGroupRegistration,
          ageFieldMode: formData.ageFieldMode || 'required',
          maxCapacity: Number(formData.maxCapacity) || 0,
          isPaidEvent: !!formData.isPaidEvent,
          itemLabel: formData.itemLabel,
          itemCost: Number(formData.itemCost) || 0,
          maxItems: Number(formData.maxItems) || 0,
          paymentPrefix: formData.paymentPrefix,
        });
        const list = [...events];
        list[editIndex] = { ...events[editIndex], ...updated };
        setEvents(list);
        showSnackbar('Event updated successfully');
      } else {
        const newEvent = await createCulturalEvent({
          title: formData.title,
          description: formData.description,
          eventDate: formData.eventDate ? formData.eventDate.toISOString() : null,
          eventEndDate: formData.eventEndDate ? formData.eventEndDate.toISOString() : null,
          isTentative: formData.isTentative,
          lastDateToApply: formData.lastDateToApply ? formData.lastDateToApply.toISOString() : null,
          active: formData.active,
          subEvents: subEventsList,
          customFields: cleanCustomFields,
          allowGroupRegistration: formData.allowGroupRegistration,
          ageFieldMode: formData.ageFieldMode || 'required',
          maxCapacity: Number(formData.maxCapacity) || 0,
          isPaidEvent: !!formData.isPaidEvent,
          itemLabel: formData.itemLabel,
          itemCost: Number(formData.itemCost) || 0,
          maxItems: Number(formData.maxItems) || 0,
          paymentPrefix: formData.paymentPrefix,
        }, events);
        setEvents([newEvent, ...events]);
        showSnackbar('Event created & notice published');
      }
      setEditIndex(-1);
      navigate('/manage-events');
    } catch (e) {
      console.error(e);
      showSnackbar('Error saving event', 'error');
    }
  };

  const handleDeleteEvent = (idx) => {
    const ev = events[idx];
    setConfirmDialog({
      open: true,
      title: 'Delete Event',
      message: `Are you sure you want to delete the event "${ev.title}"? This will also delete all associated applications.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await deleteCulturalEvent(ev.id, ev);
          const list = [...events];
          list.splice(idx, 1);
          setEvents(list);
          showSnackbar('Event deleted');
        } catch (e) {
          console.error(e);
          showSnackbar('Error deleting event', 'error');
        }
      }
    });
  };
  
  const handleToggleActive = async (idx, activeStatus) => {
    try {
      const ev = events[idx];
      await updateCulturalEvent(ev.id, { active: activeStatus });
      const list = [...events];
      list[idx].active = activeStatus;
      setEvents(list);
      showSnackbar(`Event ${activeStatus ? 'activated' : 'paused'}`);
    } catch (e) {
      console.error(e);
      showSnackbar('Error updating status', 'error');
    }
  };

  if (loading) return <SleekLoader message="Loading Events..." />;

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}
        >
          <Tab 
            value={0}
            sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
            icon={<EventIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
            iconPosition="start" 
            label="Events" 
          />
          <Tab 
            value={1}
            sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
            icon={<AddCircleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
            iconPosition="start" 
            label={editIndex >= 0 ? "Edit Event" : "Add Event"} 
          />
          <Tab 
            value={2}
            sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
            icon={<DashboardIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
            iconPosition="start" 
            label="Dashboard" 
          />
        </Tabs>
      </Box>

      {activeTab === 2 && <CulturalDashboard />}

      {activeTab === 1 && (
        <AddEditEventTab 
          eventToEdit={editIndex >= 0 ? events[editIndex] : null}
          config={config}
          onSave={handleSaveEvent}
          onCancel={() => {
            setEditIndex(-1);
            navigate('/manage-events');
          }}
        />
      )}

      {activeTab === 0 && (
        <EventsListTab 
          events={events}
          config={config}
          onToggleActive={handleToggleActive}
          onOpenApplications={openApplications}
          onEdit={(idx) => {
            setEditIndex(idx);
            navigate('/manage-events/add');
          }}
          onDelete={handleDeleteEvent}
          showSnackbar={showSnackbar}
        />
      )}

      {/* Applications Dialog */}
      {appDialog.open && (
        <ApplicationsDialog 
          appDialog={appDialog}
          setAppDialog={setAppDialog}
          config={config}
          showSnackbar={showSnackbar}
        />
      )}

      {confirmDialog.open && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </Box>
  );
};

export default CulturalPrograms;
