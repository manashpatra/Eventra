import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Fastfood as FastfoodIcon,
  Restaurant as DineIcon,
  TakeoutDining as ParcelIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getAllFoodCouponDocs } from '../../../services/foodCouponService';
import { format } from 'date-fns';
import { brand, leadsPalette, statusBadge } from '../../../theme/colorTokens';

const OnlineRedemptionDashboardTab = ({ config }) => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllFoodCouponDocs();
        setDocs(data || []);
      } catch (error) {
        console.error('Error fetching online coupons:', error);
      } finally {
        setLoading(false);
      }
    };
    if (config?.onlineFoodCouponEnabled) {
      fetchData();
    }
  }, [config?.onlineFoodCouponEnabled]);

  const stats = useMemo(() => {
    let totalRedeemed = 0;
    let vegRedeemed = 0;
    let nonVegRedeemed = 0;
    let dineRedeemed = 0;
    let parcelRedeemed = 0;
    const dayWise = {};
    const mealWise = {};
    const recentRedemptions = [];

    docs.forEach(doc => {
      (doc.coupons || []).forEach(coupon => {
        if (coupon.redeemed) {
          const plates = (coupon.normalDineOutCount || 0) + (coupon.normalParcelCount || 0) + (coupon.additionalDineOutCount || 0) + (coupon.additionalParcelCount || 0);
          totalRedeemed += plates;

          if (coupon.foodType === 'Veg') vegRedeemed += plates;
          else nonVegRedeemed += plates;

          const dine = (coupon.normalDineOutCount || 0) + (coupon.additionalDineOutCount || 0);
          const parcel = (coupon.normalParcelCount || 0) + (coupon.additionalParcelCount || 0);
          dineRedeemed += dine;
          parcelRedeemed += parcel;

          const day = coupon.day || 'Unknown';
          dayWise[day] = (dayWise[day] || 0) + plates;

          const meal = coupon.mealType || 'Unknown';
          mealWise[meal] = (mealWise[meal] || 0) + plates;

          recentRedemptions.push({
            ...coupon,
            flatNumber: doc.flatNumber,
            residentName: doc.residentName,
            plates,
          });
        }
      });
    });

    recentRedemptions.sort((a, b) => new Date(b.redeemedAt || 0).getTime() - new Date(a.redeemedAt || 0).getTime());

    return {
      totalRedeemed,
      vegRedeemed,
      nonVegRedeemed,
      dineRedeemed,
      parcelRedeemed,
      dayWise,
      mealWise,
      recentRedemptions: recentRedemptions.slice(0, 50),
    };
  }, [docs]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: leadsPalette.total.color }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon sx={{ color: leadsPalette.total.color }} />
        Online Coupon Redemptions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ bgcolor: leadsPalette.total.bg, borderColor: statusBadge.purple.border }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Plates Redeemed</Typography>
              <Typography variant="h4" sx={{ color: leadsPalette.total.color, fontWeight: 800, mt: 0.5 }}>{stats.totalRedeemed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ bgcolor: statusBadge.success.bg, borderColor: statusBadge.success.border }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Veg vs Non-Veg</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip label={`Veg: ${stats.vegRedeemed}`} size="small" sx={{ bgcolor: statusBadge.success.bg, color: statusBadge.success.text, fontWeight: 700 }} />
                <Chip label={`N-Veg: ${stats.nonVegRedeemed}`} size="small" sx={{ bgcolor: statusBadge.error.bg, color: statusBadge.error.text, fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined" sx={{ bgcolor: statusBadge.warning.bg, borderColor: statusBadge.warning.border }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Dine-in vs Parcel</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DineIcon sx={{ color: brand.orange, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stats.dineRedeemed}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ParcelIcon sx={{ color: brand.orange, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stats.parcelRedeemed}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Recent Scans / Redemptions</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Flat</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Day / Meal</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>Plates</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.recentRedemptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No redemptions yet</TableCell>
              </TableRow>
            ) : (
              stats.recentRedemptions.map((row, i) => (
                <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>
                    {row.redeemedAt ? format(new Date(row.redeemedAt), 'MMM dd, hh:mm a') : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Flat {row.flatNumber}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.residentName}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.day}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.mealType}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip label={row.foodType} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.5, fontWeight: 700 }}>
                    {row.plates}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OnlineRedemptionDashboardTab;
