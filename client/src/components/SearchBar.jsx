"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        placeholder="Buscar usuarios o publicaciones..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <button type="submit" className="search-button">
        Buscar
      </button>
    </form>
  )
}

export default SearchBar
