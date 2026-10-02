import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Fade, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, useTheme } from '@mui/material';
import {
  Assessment as ReportIcon,
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getPublicSubscriptionReport } from '../../services/publicDataService';
import { getMasterConfig } from '../../services/masterConfigService';
import { brand, surface, text, overlay, border, gradient, status, secondary, chartPalette } from '../../theme/colorTokens';

const BLOCK_COLORS = chartPalette;

const SubscriptionReportSection = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const [data, configData] = await Promise.all([
        getPublicSubscriptionReport(),
        getMasterConfig()
      ]);
      setReport(data);
      setAppConfig(configData);
    } catch (error) {
      console.error('Error loading subscription report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = useMemo(() => {
    if (!report) return [];
    return report.blockSummary.map((b) => ({
      name: `B${b.block}`,
      Paid: b.paid,
      Pending: b.pending,
      percentage: b.total > 0 ? Number(((b.paid / b.total) * 100).toFixed(1)) : 0.0,
    }));
  }, [report]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: 4, mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4, mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (!report || report.blockSummary.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 6 }}>
        <CardContent>
          <ReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No subscription data available yet.
          </Typography>
        </CardContent>
      </Card>
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
          <ReportIcon sx={{ color: text.white, fontSize: 16 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Block-wise Subscription Report
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
            {appConfig?.committeeName || 'Committee'} {appConfig?.year || ''} collection progress by block
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Flats', value: report.totalFlats, color: status.info.main(isDark), icon: <PeopleIcon /> },
          { label: 'Paid', value: report.totalPaid, color: status.success.main(isDark), icon: <TrendingUpIcon /> },
          { label: 'Pending', value: report.totalPending, color: status.warning.main(isDark), icon: <PeopleIcon /> },
          { label: 'Collected', value: formatCurrency(report.totalAmount), color: secondary.main(isDark), icon: <RupeeIcon /> },
        ].map((stat, i) => (
          <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
            <Fade in timeout={400 + i * 100}>
              <Card
                sx={{
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                    }}
                  >
                    {React.cloneElement(stat.icon, { sx: { color: stat.color, fontSize: 22 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Overall Collection Progress */}
      {report && report.totalFlats > 0 && (
        <Fade in timeout={500}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Overall Subscription Collection
                </Typography>
                <Chip
                  label={`${report.totalPaid} / ${report.totalFlats} flats`}
                  size="small"
                  sx={{
                    backgroundColor: overlay.brandMedium(isDark),
                    color: brand.orange,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={report.collectionPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: overlay.brandLight(isDark),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: gradient.brandHorizontal,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                {formatCurrency(report.totalAmount)} collected out of {formatCurrency(report.totalFlats * (appConfig?.subscriptionAmount || 1500))} target
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Bar Chart */}
      <Fade in timeout={600}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Collection Progress by Block
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                  <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: isDark ? surface.paperDark : surface.paperLight,
                      border: `1px solid ${border.divider(isDark)}`,
                      borderRadius: 8,
                      color: text.primary(isDark),
                      boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: 13, marginRight: 8 }}>
                        {value}
                      </span>
                    )}
                  />
                  <Bar dataKey="Paid" fill={status.success.main(isDark)} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`paid-${index}`} fill={status.success.main(isDark)} />
                    ))}
                  </Bar>
                  <Bar dataKey="Pending" fill={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)"} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`pending-${index}`} fill={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Detailed Table */}
      <Fade in timeout={800}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Detailed Block Report
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Block</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.blockSummary.map((block, index) => {
                    const percentage = block.total > 0 ? Number(((block.paid / block.total) * 100).toFixed(1)) : 0.0;
                    return (
                      <TableRow key={block.block}>
                        <TableCell>
                          <Chip
                            label={`Block ${block.block}`}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              backgroundColor: `${BLOCK_COLORS[index]}15`,
                              color: BLOCK_COLORS[index],
                            }}
                          />
                        </TableCell>
                        <TableCell>{block.total}</TableCell>
                        <TableCell>
                          <Typography sx={{ color: status.success.main(isDark), fontWeight: 600 }}>{block.paid}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: status.warning.main(isDark), fontWeight: 600 }}>{block.pending}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{formatCurrency(block.amount)}</Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: overlay.brandLight(isDark),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: percentage >= 80 ? status.success.main(isDark) : percentage >= 50 ? brand.gold : status.error.main(isDark),
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 32, textAlign: 'right' }}>
                              {percentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow sx={{ '& td': { fontWeight: 700, borderTop: `2px solid ${border.brandMedium(isDark)}` } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800 }}>TOTAL</Typography>
                    </TableCell>
                    <TableCell>{report.totalFlats}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: status.success.main(isDark), fontWeight: 800 }}>{report.totalPaid}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: status.warning.main(isDark), fontWeight: 800 }}>{report.totalPending}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800 }}>{formatCurrency(report.totalAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${report.collectionPercentage}%`}
                        size="small"
                        sx={{
                          backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(46,125,50,0.12)',
                          color: status.success.main(isDark),
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default SubscriptionReportSection;
