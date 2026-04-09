function ShopSection({ shop }) {
  return (
    <section className="kt-shop" id="shop">
      <div className="kt-container kt-shop-wrap">
        <div>
          <h2>{shop.title}</h2>
          <p>{shop.subtitle}</p>
          <button className="kt-btn-dark" type="button">
            {shop.cta}
          </button>
        </div>
        <div className="kt-shop-images">
          <img src={shop.mainImage} alt="" />
          <img
            src={shop.secondaryImage}
            alt=""
            className="kt-shop-sub"
          />
        </div>
      </div>
    </section>
  )
}

export default ShopSection
