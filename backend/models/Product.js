import mongoose from 'mongoose';

const SpecSchema = new mongoose.Schema({
  voltage: String,
  cores: String,
  conductor: String,
  insulation: String,
  armoring: String,
  standard: String,
});

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  specs: SpecSchema,
  // We link this product to the user who uploaded it
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model('Product', ProductSchema);