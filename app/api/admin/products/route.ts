import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .concat('-', Math.random().toString(36).substring(2, 6));
}

// GET all products for admin
export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (err: any) {
    console.error('Error fetching admin products:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      description,
      price,
      stock_quantity,
      requires_prescription,
      image_url,
      dosage_form,
      active_ingredients,
    } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'Name, category, and price are required.' }, { status: 400 });
    }

    const slug = body.slug?.trim() ? body.slug.trim().toLowerCase() : slugify(name);
    const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';

    const { data: newProduct, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: name.trim(),
        slug,
        category: category.trim(),
        description: description?.trim() || 'High quality clinical medication sourced from licensed distributors.',
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity, 10) || 50,
        requires_prescription: Boolean(requires_prescription),
        image_url: image_url?.trim() || fallbackImage,
        dosage_form: dosage_form?.trim() || 'Tablets',
        active_ingredients: active_ingredients?.trim() || name.trim(),
        rating: 5.0
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.category !== undefined) updatePayload.category = updates.category.trim();
    if (updates.description !== undefined) updatePayload.description = updates.description.trim();
    if (updates.price !== undefined) updatePayload.price = parseFloat(updates.price);
    if (updates.stock_quantity !== undefined) updatePayload.stock_quantity = parseInt(updates.stock_quantity, 10);
    if (updates.requires_prescription !== undefined) updatePayload.requires_prescription = Boolean(updates.requires_prescription);
    if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url.trim();
    if (updates.dosage_form !== undefined) updatePayload.dosage_form = updates.dosage_form.trim();
    if (updates.active_ingredients !== undefined) updatePayload.active_ingredients = updates.active_ingredients.trim();

    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
