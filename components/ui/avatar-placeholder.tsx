"use client"

interface AvatarPlaceholderProps {
  genre: "homme" | "femme"
  className?: string
}

// Avatar sans visage (silhouette) - femme avec voile, homme avec barbe légère
export function AvatarPlaceholder({ genre, className = "" }: AvatarPlaceholderProps) {
  if (genre === "femme") {
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Background */}
        <rect width="200" height="200" fill="#E7F7F4" />
        
        {/* Hijab/Voile - forme enveloppante */}
        <path
          d="M100 35C65 35 40 55 35 85C30 115 35 150 50 170C65 185 85 195 100 195C115 195 135 185 150 170C165 150 170 115 165 85C160 55 135 35 100 35Z"
          fill="#009688"
        />
        
        {/* Partie intérieure du voile (ombre) */}
        <path
          d="M100 40C70 40 50 58 45 85C40 112 45 145 58 163C71 178 87 187 100 187C113 187 129 178 142 163C155 145 160 112 155 85C150 58 130 40 100 40Z"
          fill="#006B61"
        />
        
        {/* Visage (ovale vide - pas de traits) */}
        <ellipse
          cx="100"
          cy="100"
          rx="35"
          ry="45"
          fill="#F5E6D3"
        />
        
        {/* Bord du voile autour du visage */}
        <path
          d="M65 75C60 85 58 95 58 105C58 120 62 135 70 145C80 158 90 163 100 163C110 163 120 158 130 145C138 135 142 120 142 105C142 95 140 85 135 75"
          stroke="#009688"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Plis du voile sur les épaules */}
        <path
          d="M50 150C45 160 42 175 45 190L65 195"
          stroke="#006B61"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M150 150C155 160 158 175 155 190L135 195"
          stroke="#006B61"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Avatar homme avec barbe légère
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect width="200" height="200" fill="#E7F7F4" />
      
      {/* Cheveux courts */}
      <path
        d="M60 80C60 55 75 40 100 40C125 40 140 55 140 80C140 85 138 90 135 92C138 95 140 100 140 105L140 85C140 60 125 45 100 45C75 45 60 60 60 85L60 105C60 100 62 95 65 92C62 90 60 85 60 80Z"
        fill="#3D3D3D"
      />
      
      {/* Tête/Crâne */}
      <ellipse
        cx="100"
        cy="95"
        rx="40"
        ry="45"
        fill="#F5E6D3"
      />
      
      {/* Barbe légère (forme arrondie sous le visage) */}
      <path
        d="M65 110C65 125 70 140 80 150C88 158 94 162 100 162C106 162 112 158 120 150C130 140 135 125 135 110"
        fill="#5D5D5D"
        opacity="0.3"
      />
      
      {/* Contour bas de la barbe */}
      <path
        d="M70 115C70 130 75 142 85 152C92 158 96 160 100 160C104 160 108 158 115 152C125 142 130 130 130 115"
        stroke="#4A4A4A"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      
      {/* Cou */}
      <rect
        x="85"
        y="140"
        width="30"
        height="30"
        fill="#F5E6D3"
      />
      
      {/* Épaules/Haut du corps */}
      <path
        d="M50 195C50 175 70 160 100 160C130 160 150 175 150 195L150 200L50 200L50 195Z"
        fill="#009688"
      />
      
      {/* Col de chemise/qamis */}
      <path
        d="M85 160L100 175L115 160"
        stroke="#006B61"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
