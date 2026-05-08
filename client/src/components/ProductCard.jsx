import { useState, useEffect } from 'react'
import { Rate, message } from 'antd'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { HeartOutlined, HeartFilled, ShoppingCartOutlined } from '@ant-design/icons'
import * as cartApi from '../api/apiCart'
import { toggleWishlist, checkWishlistStatus } from '../api/apiWishlist'
import { useAuth } from '../context/AuthContext'

export default function ProductCard({ product, index = 0 }) {
  const [wished, setWished] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [adding, setAdding] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Kiểm tra trạng thái wishlist khi mount (nếu đã đăng nhập)
  const productId = product?._id || product?.id;
  useEffect(() => {
    if (!user || !productId) return;
    checkWishlistStatus(productId)
      .then(res => setWished(res.data?.metadata?.wishlisted || false))
      .catch(() => {});
  }, [user, productId]);

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return; }
    let variantId = null
    if (product?.variants?.length > 0) {
      variantId = product.variants[0].options?.[0]?._id || null
    }
    setAdding(true)
    try {
      await cartApi.addToCart({ productId: product._id || product.id, quantity: 1, variantId })
      setAddedToCart(true)
      window.dispatchEvent(new Event('cart_updated'))
      message.success('Đã thêm vào giỏ hàng!')
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return; }
    setWishLoading(true)
    try {
      await toggleWishlist(productId)
      const newWished = !wished
      setWished(newWished)
      message.success(newWished ? '❤️ Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích')
      // Notify ProfilePage to reload if open
      window.dispatchEvent(new Event('wishlist_updated'))
    } catch (err) {
      message.error('Không thể cập nhật danh sách yêu thích')
    } finally {
      setWishLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.3 }}
      className="spc-wrapper"
      style={{ height: '100%' }}
    >
      <div className="spc" style={{ background: '#fff', borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Thumbnail */}
        <Link to={`/product/${product.slug || product.id}`} style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
          <div style={{ paddingTop: '100%', position: 'relative', background: '#f5f5f5' }}>
            <img
              src={product.image}
              alt={product.name}
              className="spc-img"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Discount badge */}
          {product.discount > 0 && (
            <div style={{ position: 'absolute', top: 0, right: 0, background: '#ee4d2d', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderBottomLeftRadius: 3 }}>
              -{product.discount}%
            </div>
          )}

          {/* Add to cart overlay */}
          <div className="spc-overlay" onClick={handleAddToCart} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ShoppingCartOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
              {adding ? 'Đang thêm...' : addedToCart ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
            </span>
          </div>

          {/* Wishlist btn — gọi API thực tế */}
          <button
            className="spc-wish"
            onClick={handleToggleWishlist}
            disabled={wishLoading}
            style={{ position: 'absolute', top: 6, left: 6, background: wished ? 'rgba(238,77,45,0.85)' : 'rgba(0,0,0,0.28)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {wished
              ? <HeartFilled style={{ color: '#fff', fontSize: 12 }} />
              : <HeartOutlined style={{ color: '#fff', fontSize: 12 }} />
            }
          </button>
        </Link>

        {/* Info */}
        <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '12px', color: '#333', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>
              {product.name}
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ color: '#ee4d2d', fontWeight: 700, fontSize: '14px' }}>
              {product.price?.toLocaleString('vi-VN')}đ
            </span>
            {product.originalPrice > 0 && product.originalPrice !== product.price && (
              <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '11px' }}>
                {product.originalPrice?.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <Rate disabled defaultValue={product.rating} allowHalf style={{ fontSize: 10, color: '#ffa41c' }} />
            <span style={{ fontSize: '10px', color: '#999' }}>Đã bán {product.reviews || 0}</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spc {
          box-shadow: rgba(0,0,0,0.05) 0 1px 3px 0;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .spc:hover {
          box-shadow: rgba(0,0,0,0.15) 0 4px 20px 0;
          transform: translateY(-2px);
        }
        .spc-img {
          transition: transform 0.35s ease;
        }
        .spc:hover .spc-img {
          transform: scale(1.05);
        }
        .spc-overlay {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .spc:hover .spc-overlay {
          opacity: 1;
        }
        .spc-wish {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .spc:hover .spc-wish {
          opacity: 1;
        }
      `}} />
    </motion.div>
  )
}
