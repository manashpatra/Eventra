import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, useTheme, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { 
  Event as EventIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAllCulturalEvents, getApplicationsByEvent, updateCulturalEvent } from '../../../services/culturalService';
import { formatDate } from '../../../utils/dateUtils';
import { chartPalette, statusBadge, roleColors, cultural } from '../../../theme/colorTokens';

const SummaryCard = ({ title, value, subtitle, icon, color, bg }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` }, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
    <CardContent sx={{ p: { xs: 1.5, sm: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 3 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ width: { xs: 40, sm: 56 }, height: { xs: 40, sm: 56 }, borderRadius: { xs: '12px', sm: '16px' }, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px 0 ${color}20` }}>
          {React.cloneElement(icon, { sx: { color, fontSize: { xs: 22, sm: 32 } } })}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const CulturalDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let evs = await getAllCulturalEvents();
        
        setEvents(evs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={48} thickness={4} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  const activeEvents = events.filter(e => e.active).length;
  const totalApps = events.reduce((sum, e) => sum + (e.applicationCount || 0), 0);

  // Compute subEvent (competitions) popularity
  const subEventStats = {};
  let totalCompetitions = 0;
  events.forEach(e => {
    if (e.subEventCounts) {
      Object.entries(e.subEventCounts).forEach(([name, count]) => {
        subEventStats[name] = (subEventStats[name] || 0) + count;
        totalCompetitions += count;
      });
    }
  });
  
  const COLORS = chartPalette;
  
  const pieData = Object.entries(subEventStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const chartData = events
    .filter(e => e.applicationCount > 0 || (e.eventDate && new Date(e.eventDate) >= now))
    .map(e => ({ name: e.title, Applications: e.applicationCount || 0 }))
    .sort((a, b) => b.Applications - a.Applications)
    .slice(0, 10); // Top 10 events

  const upcomingEvents = events
    .filter(e => e.eventDate && new Date(e.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    .slice(0, 4);

  return (
    <Box sx={{ pb: 4 }}>
      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid size={{ xs: 4, sm: 4 }}>
          <SummaryCard 
            title="Total Events" 
            value={events.length} 
            subtitle={`${activeEvents} Active Events`} 
            icon={<EventIcon />} 
            color={roleColors.Cultural.text} 
            bg={roleColors.Cultural.bg} 
          />
        </Grid>
        <Grid size={{ xs: 4, sm: 4 }}>
          <SummaryCard 
            title="Total Applications" 
            value={totalApps} 
            subtitle="Across all events"
            icon={<PeopleIcon />} 
            color={statusBadge.info.text} 
            bg={statusBadge.info.bg} 
          />
        </Grid>
        <Grid size={{ xs: 4, sm: 4 }}>
          <SummaryCard 
            title="Competitions Joined" 
            value={totalCompetitions} 
            subtitle="Total sub-event participations"
            icon={<TrophyIcon />} 
            color={statusBadge.warning.text} 
            bg={statusBadge.warning.bg} 
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 3 }}>
        {/* Applications Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
           <CardContent sx={{ p: { xs: 1.5, sm: 3 }, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: { xs: 1, sm: 3 }, fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>Applications by Event</Typography>
              {chartData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>No application data available yet.</Typography>
                </Box>
              ) : (
                <Box sx={{ height: { xs: 250, sm: 350 }, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} angle={-15} textAnchor="end" height={60} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                      <Tooltip cursor={{ fill: theme.palette.action.hover }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.palette.background.paper }} />
                      <Bar dataKey="Applications" fill={statusBadge.info.text} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Side Panel: Demographics & Upcoming */}
        <Grid size={{ xs: 12, lg: 4 }} container spacing={3}>
          
          {/* Top Competitions */}
          {pieData.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Typography variant="h6" sx={{ mb: { xs: 1, sm: 2 }, fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>Top Competitions</Typography>
                  <Box sx={{ height: { xs: 180, sm: 220 }, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.palette.background.paper }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Upcoming Events List */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', flexGrow: 1 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 3 }, pb: '16px !important' }}>
                <Typography variant="h6" sx={{ mb: { xs: 1, sm: 2 }, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                  <CalendarIcon color="primary" /> Upcoming Events
                </Typography>
                {upcomingEvents.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No upcoming events scheduled.</Typography>
                ) : (
                  <List disablePadding>
                    {upcomingEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: cultural.bgLight, color: cultural.pink, fontWeight: 700, borderRadius: 2 }}>
                              {new Date(event.eventDate).getDate()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={event.title} 
                            primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                            secondary={formatDate(event.eventDate)} 
                            secondaryTypographyProps={{ variant: 'caption', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                          />
                        </ListItem>
                        {index < upcomingEvents.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CulturalDashboard;
