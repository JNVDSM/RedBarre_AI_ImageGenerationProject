import { Navigate, Route, Routes } from "react-router-dom"
import RootLayout from "@/layouts/RootLayout"
import ProductsPage from "@/pages/ProductsPage"
import ProductDetailPage from "@/pages/ProductDetailPage"
import SelectedProductsPage from "@/pages/SelectedProductsPage"
import CreatorArtWorkPage from "@/pages/CreatorArtWorkPage"
import CreatorImageGenerationPage from "@/pages/CreatorImageGenerationPage"
import MyImagesPage from "@/pages/MyImagesPage"
import CreatorMerchandisePage from "@/pages/CreatorMerchandisePage"

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:styleCode" element={<ProductDetailPage />} />
        <Route path="/selected-products" element={<SelectedProductsPage />} />
        <Route path="/creator/art-work" element={<CreatorArtWorkPage />} />
        <Route path="/creator/image-generation" element={<CreatorImageGenerationPage />} />
        <Route path="/creator/images" element={<MyImagesPage />} />
        <Route path="/creator/merchandise" element={<CreatorMerchandisePage />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Route>
    </Routes>
  )
}

export default App
