import React, { useEffect, useState } from "react";
import axios from "axios";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:3005/products")
      .then((res) => {
        const productData = res.data;
        setProducts(productData);
        console.log("Product data:", productData);

        // Log images for debugging
        productData.forEach((product) => {
          console.log(`Product ${product.name} images:`, product.images);
        });

        // Group products by categoryId
        const grouped = productData.reduce((acc, product) => {
          const category = product.categoryId || "Uncategorized";
          if (!acc[category]) acc[category] = [];
          acc[category].push(product);
          return acc;
        }, {});
        setGroupedProducts(grouped);
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  return (
    <div className="p-6 space-y-12 bg-gray-50">
      {Object.entries(groupedProducts).map(([category, items]) => (
        <div key={category} className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            {category}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.slice(0, 8).map((product) => (
              <div
                key={product.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {/* Image Gallery */}
                <div className="relative w-full h-40 overflow-x-auto flex snap-x snap-mandatory">
                  {product.images && product.images.length > 0 && product.images.some((img) => img && typeof img === "string") ? (
                    product.images.map((image, index) => (
                      image && typeof image === "string" ? (
                        <img
                          key={index}
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-40 object-cover snap-center flex-shrink-0"
                          onError={(e) => {
                            console.log(`Failed to load image: ${image}`);
                            e.target.style.display = "none"; // Hide broken image
                            e.target.parentElement.appendChild(
                              Object.assign(document.createElement("div"), {
                                className:
                                  "w-full h-40 bg-gray-200 flex items-center justify-center snap-center flex-shrink-0 text-gray-500 text-sm",
                                textContent: "Image Unavailable",
                              })
                            );
                          }}
                        />
                      ) : (
                        <div
                          key={index}
                          className="w-full h-40 bg-gray-200 flex items-center justify-center snap-center flex-shrink-0 text-gray-500 text-sm"
                        >
                          Invalid Image
                        </div>
                      )
                    ))
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      No Image Available
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right mt-4">
            <button className="text-sm text-blue-600 hover:underline">
              View All
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Product;