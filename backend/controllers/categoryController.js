const ServiceCategory = require('../models/ServiceCategory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { audit } = require('../services/auditService');

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// @route GET /api/categories
const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  let categories = await ServiceCategory.find(filter).sort({ name: 1 });
  if (categories.length === 0 && !req.query.includeInactive) {
    const { ensureDefaultCategories } = require('../services/defaultCategories');
    await ensureDefaultCategories();
    categories = await ServiceCategory.find(filter).sort({ name: 1 });
  }
  res.json({ success: true, data: categories });
});

// @route GET /api/categories/:id
const getCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, data: category });
});

// @route POST /api/categories  (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, keywords, requiredSkills, basePrice, pricingUnit } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required.');

  const category = await ServiceCategory.create({
    name,
    slug: slugify(name),
    description,
    icon,
    keywords: keywords || [],
    requiredSkills: requiredSkills || [],
    basePrice: basePrice || 0,
    pricingUnit: pricingUnit || 'flat',
    createdBy: req.user._id,
  });

  await audit({ actor: req.user, action: 'CATEGORY_CREATED', entityType: 'ServiceCategory', entityId: category._id, details: { name } });
  res.status(201).json({ success: true, data: category });
});

// @route PUT /api/categories/:id  (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const fields = ['name', 'description', 'icon', 'keywords', 'requiredSkills', 'basePrice', 'pricingUnit', 'surgeMultiplier', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  if (req.body.name) category.slug = slugify(req.body.name);

  await category.save();
  await audit({ actor: req.user, action: 'CATEGORY_UPDATED', entityType: 'ServiceCategory', entityId: category._id, details: req.body });
  res.json({ success: true, data: category });
});

// @route DELETE /api/categories/:id (admin) - soft delete
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  category.isActive = false;
  await category.save();
  await audit({ actor: req.user, action: 'CATEGORY_DEACTIVATED', entityType: 'ServiceCategory', entityId: category._id });
  res.json({ success: true, message: 'Category deactivated.' });
});

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
