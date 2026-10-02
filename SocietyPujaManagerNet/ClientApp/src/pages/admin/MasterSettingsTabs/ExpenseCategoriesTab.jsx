import React from 'react';
import { Card, CardContent, Typography, Alert, Box, TextField, Button, Switch, FormControlLabel } from '@mui/material';
import { Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

const ExpenseCategoriesTab = ({ config, setConfig, saveSectionConfig }) => {
  const handleCategoryChange = (catIdx, field, value) => {
    const newCats = [...config.expenseCategories];
    newCats[catIdx] = { ...newCats[catIdx], [field]: value };
    setConfig({ ...config, expenseCategories: newCats });
  };

  const handleSubCategoryChange = (catIdx, subIdx, field, value) => {
    const newCats = [...config.expenseCategories];
    const newSubs = [...newCats[catIdx].subCategories];
    newSubs[subIdx] = { ...newSubs[subIdx], [field]: value };
    newCats[catIdx] = { ...newCats[catIdx], subCategories: newSubs };
    setConfig({ ...config, expenseCategories: newCats });
  };

  const addCategory = () => {
    const newCats = [
      ...(config.expenseCategories || []),
      { id: uuidv4(), name: '', active: true, subCategories: [] }
    ];
    setConfig({ ...config, expenseCategories: newCats });
  };

  const addSubCategory = (catIdx) => {
    const newCats = [...config.expenseCategories];
    newCats[catIdx].subCategories = [
      ...(newCats[catIdx].subCategories || []),
      { id: uuidv4(), name: '', active: true }
    ];
    setConfig({ ...config, expenseCategories: newCats });
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Expense Categories & Sub-Categories</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Categories and Sub-categories now use unique IDs behind the scenes. You can safely edit names or disable old options without breaking historical expense records.
        </Alert>

        {config.expenseCategories?.map((cat, catIdx) => (
          <Box key={cat.id || catIdx} sx={{ mb: 4, p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
            {/* Category Header */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
              <TextField
                label="Category Name"
                value={cat.name || cat.category || ''}
                onChange={(e) => handleCategoryChange(catIdx, 'name', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={cat.active !== false}
                    onChange={(e) => handleCategoryChange(catIdx, 'active', e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" color={cat.active !== false ? 'text.primary' : 'text.secondary'}>{cat.active !== false ? 'Active' : 'Disabled'}</Typography>}
              />
            </Box>

            {/* Sub Categories */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>Sub-Categories</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.5, pl: 2, borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
              {cat.subCategories?.map((sub, subIdx) => (
                <Box key={sub.id || subIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: '1 1 250px', p: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <TextField
                    placeholder="Sub-category name"
                    value={sub.name || (typeof sub === 'string' ? sub : '')}
                    onChange={(e) => handleSubCategoryChange(catIdx, subIdx, 'name', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={sub.active !== false}
                        onChange={(e) => handleSubCategoryChange(catIdx, subIdx, 'active', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={<Typography variant="caption" color={sub.active !== false ? 'text.primary' : 'text.secondary'}>{sub.active !== false ? 'Active' : 'Disabled'}</Typography>}
                    sx={{ mr: 0 }}
                  />
                </Box>
              ))}

              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => addSubCategory(catIdx)}
                size="small"
                sx={{ flex: '0 0 auto', alignSelf: 'center', ml: 1 }}
              >
                Add Sub-Category
              </Button>
            </Box>
          </Box>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCategory} size="small">
            Add Category
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('Expense Categories')} size="small">
            Save Categories
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpenseCategoriesTab;
