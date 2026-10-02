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
  Groups as GroupsIcon,
  Phone as PhoneIcon,
  Apartment as FlatIcon,
} from '@mui/icons-material';
import { getDPCCommittee } from '../../services/publicDataService';
import { getMasterConfig } from '../../services/masterConfigService';
import { gradient, text, status, getDpcRoleColor } from '../../theme/colorTokens';

// Role icon mapping
const getRoleIcon = (icon) => {
  const iconMap = {
    crown: '👑',
    pen: '✍️',
    rupee: '💰',
    handshake: '🤝',
    music: '🎭',
  };
  return iconMap[icon] || '🏛️';
};

// Role color mapping from colorTokens
const getRoleColor = (role) => getDpcRoleColor(role);

const DPCSection = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const [data, configData] = await Promise.all([
        getDPCCommittee(),
        getMasterConfig(),
      ]);
      setMembers(data);
      setAppConfig(configData);
    } catch (error) {
      console.error('Error loading DPC committee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 4, mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <GroupsIcon sx={{ color: text.white, fontSize: 16 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {appConfig?.committeeName || 'Committee'} {appConfig?.year || ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
            Contact Directory
          </Typography>
        </Box>
      </Box>

      {/* Members Grid */}
      <Grid container spacing={2}>
        {members.map((member, index) => {
          const roleColor = getRoleColor(member.role);
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
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
                      {/* Role Icon */}
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: roleColor.bg,
                          fontSize: '1.4rem',
                          flexShrink: 0,
                        }}
                      >
                        {getRoleIcon(member.icon)}
                      </Avatar>

                      {/* Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Chip
                          label={member.role}
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
                          {member.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <FlatIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {member.flatNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Phone */}
                      <Tooltip title={`Call ${member.phone}`}>
                        <IconButton
                          component="a"
                          href={`tel:${member.phone.replace(/\s/g, '')}`}
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
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Footer Note */}
      <Fade in timeout={1200}>
        <Card sx={{ mt: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Residents are requested to contact the respective committee members for any {appConfig?.committeeName || 'committee'} {appConfig?.year || ''}-related assistance.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                mt: 1,
                background: gradient.brandText,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ॥ শুভ শারদীয়া ॥
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default DPCSection;
