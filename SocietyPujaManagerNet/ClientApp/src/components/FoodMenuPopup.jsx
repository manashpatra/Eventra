import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Card, CardContent, Grid, Chip, Fade, Slide, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Close as CloseIcon,
  RestaurantMenu as MenuIcon,
  WbTwilight as BreakfastIcon,
  WbSunny as LunchIcon,
  NightsStay as DinnerIcon,
  CurrencyRupee as RupeeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { getAvailableFoodTypes } from '../services/masterConfigService';
import { printHTML } from '../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles } from '../utils/print/shared';
import { formatShortDate } from '../utils/dateUtils';
import { formatMenuText, formatMenuTextHTML, getMealDisplayName } from '../utils/textFormatters';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { brand, surface, text, overlay, gradient, border, shadow, status, getMealTypeColor, printTheme } from '../theme/colorTokens';

const Transition = function Transition({ ref, ...props }) {
  return <Slide direction="up" ref={ref} {...props} />;
};

const getMealIcon = (meal) => {
  switch (meal) {
    case 'Breakfast': return <BreakfastIcon sx={{ fontSize: '1rem' }} />;
    case 'Lunch': return <LunchIcon sx={{ fontSize: '1rem' }} />;
    case 'Dinner': return <DinnerIcon sx={{ fontSize: '1rem' }} />;
    default: return <MenuIcon sx={{ fontSize: '1rem' }} />;
  }
};

const getFoodTypeStyles = (type, isDark = true) => getMealTypeColor(type, isDark);

const isVeg = (type) => ['Veg', 'Khichuri', 'Lucchi'].includes(type);
const isNonVeg = (type) => ['Chicken', 'Mutton', 'Non-Veg'].includes(type);
const isPureVegDay = (day) => {
  return !['Breakfast', 'Lunch', 'Dinner'].some(meal => {
    return getAvailableFoodTypes(day, meal).some(isNonVeg);
  });
};

const FoodMenuPopup = ({ open, onClose, config }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const getInitialFilter = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('menu=veg')) return 'Veg';
    if (hash.includes('menu=all')) return 'All';
    if (hash.includes('menu=non-veg')) return 'Non-Veg';
    return 'Non-Veg';
  };

  const [filter, setFilter] = useState(getInitialFilter);

  React.useEffect(() => {
    if (open) {
      setFilter(getInitialFilter());
    }
  }, [open]);

  const handleFilterChange = (e, newFilter) => {
    if (newFilter) {
      setFilter(newFilter);
      const currentHash = window.location.hash.split('?')[0];
      window.history.replaceState(null, '', `${currentHash}?menu=${newFilter.toLowerCase()}`);
    }
  };

  if (!config || !config.foodDays) {
    if (!open) return null;
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2, bgcolor: surface.paper(isDark) }}>
          <CircularProgress sx={{ color: brand.orange }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Loading Festive Menu...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const handlePrintAll = () => {
    let contentHtml = `
      <html>
        <head>
          <title>Festive Menu</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: ${printTheme.text}; }
            ${getPrintHeaderStyles(false)}
            .day-container { page-break-inside: avoid; margin-bottom: 30px; }
            .page-break-after { page-break-after: always; }
            h1 { text-align: center; color: ${printTheme.headingRed}; border-bottom: 2px solid ${printTheme.headingRed}; padding-bottom: 10px; margin-bottom: 20px; }
            .date { font-size: 14px; color: ${printTheme.textSecondary}; font-weight: normal; }
            .meal-section { margin-bottom: 25px; page-break-inside: avoid; }
            .meal-title { font-size: 18px; font-weight: bold; color: ${printTheme.headingBlue}; margin-bottom: 12px; border-bottom: 1px solid ${printTheme.borderDivider}; padding-bottom: 5px; }
            .food-type { margin-bottom: 15px; padding-left: 10px; border-left: 3px solid ${printTheme.tagBorder}; }
            .food-name { font-weight: bold; font-size: 15px; }
            .food-price { font-size: 13px; color: ${printTheme.textSecondary}; margin-left: 10px; background: ${printTheme.priceBg}; padding: 2px 6px; border-radius: 4px; }
            .food-menu { color: ${printTheme.menuText}; margin-top: 6px; font-size: 14px; line-height: 1.4; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${getPrintHeaderHTML(config)}
    `;

    const validDayBlocks = [];

    config.foodDays.filter(d => d.enabled).forEach(day => {
      let mealHtml = '';
      
      ['Breakfast', 'Lunch', 'Dinner'].forEach(meal => {
        let availableTypes = getAvailableFoodTypes(day, meal);
        if (filter === 'Veg') {
          availableTypes = availableTypes.filter(isVeg);
        } else if (filter === 'Non-Veg') {
          const hasNonVeg = availableTypes.some(isNonVeg);
          if (hasNonVeg) availableTypes = availableTypes.filter(isNonVeg);
        }
        
        if (availableTypes.length > 0) {
          mealHtml += `<div class="meal-section"><div class="meal-title">${getMealDisplayName(day.dayName, meal)}</div>`;
          availableTypes.forEach(type => {
            const typeConfig = day.mealPrices[meal][type] || day.mealPrices[meal]['Non-Veg'];
            if (typeConfig) {
              const { color } = getFoodTypeStyles(type);
              mealHtml += `<div class="food-type" style="border-left-color: ${color};">`;
              mealHtml += `<span class="food-name" style="color: ${color};">${type}</span>`;
              const hasNormal = typeConfig.normal !== undefined && typeConfig.normal !== null && typeConfig.normal !== '';
              const priceToShow = hasNormal ? typeConfig.normal : (typeConfig.additional || 0);
              mealHtml += `<span class="food-price">₹${priceToShow}</span>`;
              if (Number(typeConfig.parcelPacking) > 0) {
                mealHtml += `<span class="food-price" style="background:${printTheme.parcelBg}; color:${printTheme.parcelText}; margin-left:5px;">Parcel: +₹${typeConfig.parcelPacking}</span>`;
              }
              if (typeConfig.menu) {
                mealHtml += `<div class="food-menu">${formatMenuTextHTML(typeConfig.menu)}</div>`;
              }
              mealHtml += `</div>`;
            }
          });
          mealHtml += `</div>`;
        }
      });
      
      if (mealHtml) {
        validDayBlocks.push({ day, mealHtml });
      }
    });

    validDayBlocks.forEach((block, index) => {
      const { day, mealHtml } = block;
      const formattedDate = formatShortDate(day.date, config?.dateFormat);
      const dayNameStr = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      const pureVeg = isPureVegDay(day);
      
      let badgeStyle = '';
      let badgeText = '';

      if (pureVeg) {
        badgeStyle = `background: ${printTheme.badgeVegBg}; color: ${printTheme.badgeVegText}; border: 1px solid ${printTheme.badgeVegBorder};`;
        badgeText = 'Veg';
      } else if (filter === 'Veg') {
        badgeStyle = `background: ${printTheme.badgeVegBg}; color: ${printTheme.badgeVegText}; border: 1px solid ${printTheme.badgeVegBorder};`;
        badgeText = 'Veg';
      } else if (filter === 'Non-Veg') {
        badgeStyle = `background: ${printTheme.badgeNonVegBg}; color: ${printTheme.badgeNonVegText}; border: 1px solid ${printTheme.badgeNonVegBorder};`;
        badgeText = 'Non-Veg';
      }
      
      const filterBadge = badgeText ? `<span style="font-size: 12px; padding: 3px 8px; border-radius: 12px; vertical-align: text-bottom; margin-left: 10px; font-weight: bold; ${badgeStyle}">${badgeText}</span>` : '';
      
      const isEven = (index + 1) % 2 === 0;
      const isLast = index === validDayBlocks.length - 1;
      const pageBreakClass = (isEven && !isLast) ? ' page-break-after' : '';
      
      contentHtml += `<div class="day-container${pageBreakClass}">`;
      contentHtml += `<h1>${day.dayName} <span class="date">(${formattedDate} - ${dayNameStr})</span>${filterBadge}</h1>`;
      contentHtml += mealHtml;
      contentHtml += `</div>`;
    });

    contentHtml += '</body></html>';

    printHTML(contentHtml);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      slotProps={{ paper: {
        sx: isMobile ? {
          m: 1,
          width: '100%',
          height: 'calc(100% - 16px)',
          maxHeight: 'none',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          background: isDark ? gradient.menuDark : surface.paperLight,
          color: text.primary(isDark),
          boxShadow: shadow.dialog(isDark),
          border: `1px solid ${border.subtle(isDark)}`,
          overflow: 'hidden'
        } : {
          borderRadius: 2,
          background: isDark ? gradient.menuDark : surface.paperLight,
          color: text.primary(isDark),
          boxShadow: shadow.dialog(isDark),
          border: `1px solid ${border.subtle(isDark)}`,
          overflow: 'hidden'
        }
      } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: { xs: 1.5, sm: 2 },
        px: 1.5, py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: isDark ? overlay.shadowMedium : overlay.brandXLight(false)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 auto' }}>
          <Box sx={{ 
            width: 32, height: 32, borderRadius: '4px', background: gradient.brand, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.brandBtn,
            flexShrink: 0
          }}>
            <MenuIcon sx={{ color: text.white, fontSize: '1.2rem' }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '0px', whiteSpace: 'nowrap', color: 'text.primary' }}>
            Festive Menu
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'center', sm: 'flex-end' }, 
          width: { xs: '100%', sm: 'auto' }, 
          order: { xs: 3, sm: 2 } 
        }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
            sx={{ 
              bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', 
              borderRadius: '8px',
              border: isDark ? 'none' : '1px solid rgba(0,0,0,0.08)',
              p: 0.5,
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              '& .MuiToggleButton-root': { 
                flex: { xs: 1, sm: '0 0 auto' },
                color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', 
                border: 'none',
                borderRadius: '6px !important',
                py: { xs: 0.75, sm: 0.5 }, px: 2,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: overlay.neutralLight(isDark), color: text.primary(isDark) }
              } 
            }}
          >
            <ToggleButton value="Non-Veg" sx={{ '&.Mui-selected': { bgcolor: `${status.error.main(isDark)} !important`, color: `${text.white} !important`, boxShadow: shadow.tooltipShadow } }}>Non-Veg</ToggleButton>
            <ToggleButton value="Veg" sx={{ '&.Mui-selected': { bgcolor: `${status.success.main(isDark)} !important`, color: `${text.white} !important`, boxShadow: shadow.tooltipShadow } }}>Veg</ToggleButton>
            <ToggleButton value="All" sx={{ '&.Mui-selected': { bgcolor: isDark ? `${overlay.neutralStrong(true)} !important` : `${overlay.neutralStrong(false)} !important`, color: `${text.primary(isDark)} !important` } }}>All</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, order: { xs: 2, sm: 3 } }}>
          <IconButton onClick={handlePrintAll} sx={{ color: isDark ? overlay.whiteBold : 'text.secondary', '&:hover': { color: text.primary(isDark), bgcolor: overlay.neutralLight(isDark) } }} title="Print All Days">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose} autoFocus sx={{ color: isDark ? overlay.whiteBold : 'text.secondary', '&:hover': { color: text.primary(isDark), bgcolor: overlay.neutralLight(isDark) } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1, sm: 1.5 }, py: 2, bgcolor: surface.page(isDark), '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: overlay.neutralMedium(isDark), borderRadius: '4px' } }}>
        {config.foodDays.filter(d => d.enabled).map((day, dIdx) => {
          const formattedDate = formatShortDate(day.date, config?.dateFormat);
          const dayNameStr = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
          const pureVeg = isPureVegDay(day);
          
          return (
            <Box key={dIdx} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: brand.gold, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {day.dayName}
                </Typography>
                <Chip label={`${formattedDate} (${dayNameStr})`} size="small" sx={{ bgcolor: overlay.goldMedium(isDark), color: brand.gold, fontWeight: 600, border: `1px solid ${border.goldMedium(isDark)}` }} />
                {pureVeg && (
                  <Chip label="Veg" size="small" sx={{ bgcolor: getMealTypeColor('Veg', isDark).bg, color: getMealTypeColor('Veg', isDark).color, fontWeight: 800, border: `1px solid ${getMealTypeColor('Veg', isDark).color}40`, height: 24 }} />
                )}
                <Box sx={{ flexGrow: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,179,0,0.4) 0%, transparent 100%)' }} />
              </Box>

            <Grid container spacing={1.5}>
              {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                let availableTypes = getAvailableFoodTypes(day, meal);
                if (filter === 'Veg') {
                  availableTypes = availableTypes.filter(isVeg);
                } else if (filter === 'Non-Veg') {
                  const hasNonVeg = availableTypes.some(isNonVeg);
                  if (hasNonVeg) availableTypes = availableTypes.filter(isNonVeg);
                }
                
                if (availableTypes.length === 0) return null;

                const mealConfig = day.mealPrices[meal];

                return (
                  <Grid key={meal} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Fade in timeout={500 + (dIdx * 200)}>
                      <Card sx={{ 
                        height: '100%', borderRadius: 2,
                        bgcolor: isDark ? overlay.neutralXLight(true) : surface.paperLight, 
                        border: `1px solid ${border.light(isDark)}`,
                        boxShadow: isDark ? 'none' : shadow.paperLight,
                        backdropFilter: 'blur(10px)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: shadow.cardHover(isDark),
                          border: `1px solid ${border.brandMedium(isDark)}`
                        }
                      }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                            <Box sx={{ color: status.info.main(isDark), p: 0.75, bgcolor: isDark ? 'rgba(100,181,246,0.1)' : 'rgba(25,118,210,0.08)', borderRadius: '4px', display: 'flex' }}>
                              {getMealIcon(meal)}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{getMealDisplayName(day.dayName, meal)}</Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {availableTypes.map(type => {
                              const typeConfig = mealConfig[type] || mealConfig['Non-Veg'];
                              if (!typeConfig) return null;
                              const { bg, color } = getFoodTypeStyles(type, isDark);

                              return (
                                <Box key={type} sx={{ 
                                  px: 1, py: 1, borderRadius: 1,
                                  bgcolor: isDark ? overlay.shadowMedium : surface.pageLight,
                                  border: isDark ? 'none' : `1px solid ${border.subtle(false)}`,
                                  borderLeft: `3px solid ${color} !important`,
                                  position: 'relative', overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', 
                                    background: `linear-gradient(90deg, transparent 0%, ${bg} 100%)`, opacity: 0.3, zIndex: 0 
                                  }} />
                                  
                                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Chip label={type} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, height: 24 }} />
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? brand.gold : brand.orangeDark, display: 'flex', alignItems: 'center' }}>
                                          <RupeeIcon sx={{ fontSize: 14 }} /> {(typeConfig.normal !== undefined && typeConfig.normal !== null && typeConfig.normal !== '') ? typeConfig.normal : (typeConfig.additional || 0)}
                                        </Typography>
                                        {Number(typeConfig.parcelPacking) > 0 && (
                                          <>
                                            <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center' }}>|</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', color: isDark ? status.info.light(true) : status.info.dark(false), fontWeight: 700 }}>
                                              <Typography component="span" sx={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', textTransform: 'uppercase', mr: 0.5 }}>
                                                Parcel
                                              </Typography>
                                              <Typography component="span" sx={{ fontSize: '0.875rem' }}>
                                                +<RupeeIcon sx={{ fontSize: 14, verticalAlign: 'middle', position: 'relative', bottom: '1px' }} />{typeConfig.parcelPacking}
                                              </Typography>
                                            </Box>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                    {typeConfig.menu && (
                                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.3, fontSize: '0.75rem' }}>
                                        {formatMenuText(typeConfig.menu)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )})}
      </DialogContent>
    </Dialog>
  );
};

export default FoodMenuPopup;
