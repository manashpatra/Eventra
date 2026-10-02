import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Fade,
  Skeleton,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContactPhone as ContactIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getSocietyContacts } from '../../services/publicDataService';
import { getMasterConfig } from '../../services/masterConfigService';
import { gradient, text, status, getSocietyContactColor } from '../../theme/colorTokens';

// Emoji mapping for roles
const getRoleIcon = (role) => {
  const lower = (role || '').toLowerCase();
  if (lower.includes('facility')) return '🏢';
  if (lower.includes('technical')) return '⚙️';
  if (lower.includes('civil')) return '🏗️';
  if (lower.includes('support')) return '🛠️';
  if (lower.includes('security')) return '🛡️';
  if (lower.includes('electrical') || lower.includes('electrician')) return '⚡';
  if (lower.includes('plumb') || lower.includes('plumber')) return '🚰';
  if (lower.includes('house keeping') || lower.includes('housekeeping')) return '🧹';
  if (lower.includes('incharge') || lower.includes('in charge')) return '🧑‍💼';
  return '📞';
};

const getRoleColor = (role) => getSocietyContactColor(role);

const SocietySection = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const [data, configData] = await Promise.all([
        getSocietyContacts(),
        getMasterConfig()
      ]);
      setContacts(data || []);
      setAppConfig(configData);
    } catch (error) {
      console.error('Error loading society contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 4, mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6 }} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: gradient.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ContactIcon sx={{ color: text.white, fontSize: 16 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Society Directory
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
            Facility management & resident support contact list
          </Typography>
        </Box>
      </Box>

      {/* Contacts Grid */}
      <Grid container spacing={2}>
        {contacts.map((contact, index) => {
          const roleColor = getRoleColor(contact.role);
          const isEmail = contact.email && contact.email.includes('@');
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={contact.id || index}>
              <Fade in timeout={400 + index * 80}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: `${roleColor.primary}40`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${roleColor.primary}15`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Role Avatar Emoji */}
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: roleColor.bg,
                          fontSize: '1.4rem',
                          flexShrink: 0,
                        }}
                      >
                        {getRoleIcon(contact.role)}
                      </Avatar>

                      {/* Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Chip
                          label={contact.role}
                          size="small"
                          sx={{
                            backgroundColor: roleColor.bg,
                            color: roleColor.primary,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 22,
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {contact.name || 'Not Configured'}
                        </Typography>
                        {contact.email && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                            <Box sx={{ mt: 0.3 }}>
                              {isEmail ? (
                                <EmailIcon sx={{ fontSize: 13, color: 'text.secondary', display: 'block' }} />
                              ) : (
                                <InfoIcon sx={{ fontSize: 13, color: 'text.secondary', display: 'block' }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, flex: 1, minWidth: 0 }}>
                              {contact.email.split(/[;,]/).map((emailRaw, idx) => {
                                const email = emailRaw.trim();
                                if (!email) return null;
                                return (
                                  <Typography 
                                    key={idx}
                                    component="a"
                                    href={isEmail ? `mailto:${email}` : undefined}
                                    variant="caption" 
                                    sx={{ 
                                      color: isEmail ? 'primary.main' : 'text.secondary', 
                                      display: 'block', 
                                      wordBreak: 'break-all',
                                      textDecoration: 'none',
                                      cursor: isEmail ? 'pointer' : 'default',
                                      lineHeight: 1.2,
                                      '&:hover': isEmail ? { textDecoration: 'underline' } : {}
                                    }}
                                  >
                                    {email}
                                  </Typography>
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {contact.phone && (
                          <Tooltip title={`Call ${contact.phone}`}>
                            <IconButton
                              component="a"
                              href={`tel:${contact.phone.replace(/\s/g, '')}`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(102,187,106,0.1)',
                                color: status.success.main(true),
                                '&:hover': {
                                  backgroundColor: 'rgba(102,187,106,0.2)',
                                },
                              }}
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isEmail && (
                          <Tooltip title={`Email ${contact.email}`}>
                            <IconButton
                              component="a"
                              href={`mailto:${contact.email.replace(/;/g, ',')}`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(66,165,245,0.1)',
                                color: status.info.main(true),
                                '&:hover': {
                                  backgroundColor: 'rgba(66,165,245,0.2)',
                                },
                              }}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default SocietySection;
