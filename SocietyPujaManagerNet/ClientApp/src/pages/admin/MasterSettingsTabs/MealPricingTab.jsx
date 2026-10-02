import React from 'react';
import { Card, CardContent, Typography, Box, Button, Alert, Tabs, Tab, FormControlLabel, Switch, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, TextField, Checkbox, useTheme } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { brand, getMealTypeColor } from '../../../theme/colorTokens';

const MealPricingTab = ({
  config,
  selectedDayIndex,
  setSelectedDayIndex,
  updateMealEnabled,
  updateMealVegOnly,
  updateMealSplitVeg,
  updateMealSplitNonVeg,
  updateMealPrice,
  saveSectionConfig
}) => {
  const theme = useTheme();
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Meal Pricing Configuration</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Configure pricing and menus for each meal and food type. Use the toggles to enable or split specific food categories (e.g., Split Veg for Khichuri/Lucchi). Parcel availability and packing charges apply per parcel.
        </Alert>
        {config.foodDays && config.foodDays.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Tabs value={selectedDayIndex} onChange={(e, v) => setSelectedDayIndex(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
              {config.foodDays.map((day, idx) => (
                <Tab key={idx} label={day.dayName || `Day ${idx + 1}`} />
              ))}
            </Tabs>

            {['Breakfast', 'Lunch', 'Dinner'].map((meal) => {
              const dayPrices = config.foodDays[selectedDayIndex].mealPrices || {};
              const mealPriceConfig = dayPrices[meal] || { Veg: { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true }, 'Non-Veg': { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true } };

              return (
                <Box key={meal} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: brand.gold }}>
                      {meal === 'Breakfast' ? '🌅' : meal === 'Lunch' ? '☀️' : '🌙'} {meal}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            color="primary"
                            checked={mealPriceConfig.enabled !== false}
                            onChange={(e) => updateMealEnabled(selectedDayIndex, meal, e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Enabled</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            color="secondary"
                            checked={mealPriceConfig.vegOnly || false}
                            onChange={(e) => updateMealVegOnly(selectedDayIndex, meal, e.target.checked)}
                            disabled={mealPriceConfig.enabled === false}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Veg Only</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={mealPriceConfig.splitVeg || false}
                            onChange={(e) => updateMealSplitVeg(selectedDayIndex, meal, e.target.checked)}
                            disabled={mealPriceConfig.enabled === false}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Split Veg</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={mealPriceConfig.splitNonVeg || false}
                            onChange={(e) => updateMealSplitNonVeg(selectedDayIndex, meal, e.target.checked)}
                            disabled={mealPriceConfig.enabled === false || mealPriceConfig.vegOnly}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Split Non-Veg</Typography>}
                      />
                    </Box>
                  </Box>
                  {mealPriceConfig.enabled !== false && (
                    <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Food Type</TableCell>
                            <TableCell>Menu</TableCell>
                            <TableCell>Normal (₹)</TableCell>
                            <TableCell>Additional (₹)</TableCell>
                            <TableCell align="center">Parcel</TableCell>
                            <TableCell>Packing (₹)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {['Veg', 'Non-Veg', 'Khichuri', 'Lucchi', 'Chicken', 'Mutton'].map((foodType) => {
                            const isVegOnly = mealPriceConfig.vegOnly || false;
                            const isSplitVeg = mealPriceConfig.splitVeg || false;
                            const isSplitNonVeg = mealPriceConfig.splitNonVeg || false;

                            if (foodType === 'Veg') {
                              if (isSplitVeg) return null;
                            } else if (foodType === 'Non-Veg') {
                              if (isVegOnly || isSplitNonVeg) return null;
                            } else if (foodType === 'Chicken' || foodType === 'Mutton') {
                              if (isVegOnly || !isSplitNonVeg) return null;
                            } else if (foodType === 'Khichuri' || foodType === 'Lucchi') {
                              if (!isSplitVeg) return null;
                            }
                            const chipLabel = foodType;
                            const { color: chipColor, bg: chipBg } = getMealTypeColor(foodType, theme.palette.mode === 'dark');
                            const prices = mealPriceConfig[foodType] || { normal: 0, additional: 0, parcelPacking: 0, parcelEnabled: true };
                            return (
                              <TableRow key={foodType}>
                                <TableCell>
                                  <Chip label={chipLabel} size="small" sx={{
                                    fontWeight: 600,
                                    backgroundColor: chipBg,
                                    color: chipColor,
                                  }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" variant="standard"
                                    placeholder="Enter menu items..."
                                    value={prices.menu || ''}
                                    onChange={(e) => updateMealPrice(selectedDayIndex, meal, foodType, 'menu', e.target.value)}
                                    sx={{ minWidth: 200 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" type="number" variant="standard"
                                    value={prices.normal !== undefined ? prices.normal : ''}
                                    onChange={(e) => updateMealPrice(selectedDayIndex, meal, foodType, 'normal', e.target.value)}
                                    sx={{ width: 80 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" type="number" variant="standard"
                                    value={prices.additional !== undefined ? prices.additional : ''}
                                    onChange={(e) => updateMealPrice(selectedDayIndex, meal, foodType, 'additional', e.target.value)}
                                    sx={{ width: 80 }} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    size="small"
                                    checked={prices.parcelEnabled !== false}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      updateMealPrice(selectedDayIndex, meal, foodType, 'parcelEnabled', isChecked);
                                      if (!isChecked) {
                                        updateMealPrice(selectedDayIndex, meal, foodType, 'parcelPacking', 0);
                                      }
                                    }}
                                    sx={{ p: 0.5 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" type="number" variant="standard"
                                    disabled={prices.parcelEnabled === false}
                                    value={prices.parcelPacking !== undefined ? prices.parcelPacking : ''}
                                    onChange={(e) => updateMealPrice(selectedDayIndex, meal, foodType, 'parcelPacking', e.target.value)}
                                    sx={{ width: 80 }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              );
            })}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('Meal Pricing Configurations')} size="small">
                Save Meal Pricing
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MealPricingTab;
