import { useNavigate } from "react-router-dom";
import referenceDesign from "@/assets/reference-design.svg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative">
      {/* Background SVG Design */}
      <img 
        src={referenceDesign} 
        alt="تطبيق صلة للتواصل بين الأولياء والأساتذة" 
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      
      {/* Interactive overlay for login buttons - positioned to match the design */}
      <div className="absolute inset-0">
        <div className="container mx-auto h-full flex items-end justify-center pb-24">
          <div className="grid grid-cols-3 gap-6 w-full max-w-5xl px-4">
            {/* أولياء الأمور Button - Positioned over the left card */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/login/parent")}
                className="w-full h-52 rounded-3xl bg-transparent hover:bg-white/5 transition-all cursor-pointer border-2 border-transparent hover:border-white/20"
                aria-label="تسجيل الدخول - أولياء الأمور"
              />
            </div>
            
            {/* المعلمين Button - Positioned over the middle card */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/login/teacher")}
                className="w-full h-52 rounded-3xl bg-transparent hover:bg-white/5 transition-all cursor-pointer border-2 border-transparent hover:border-white/20"
                aria-label="تسجيل الدخول - المعلمين"
              />
            </div>
            
            {/* الإدارة Button - Positioned over the right card */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/login/admin")}
                className="w-full h-52 rounded-3xl bg-transparent hover:bg-white/5 transition-all cursor-pointer border-2 border-transparent hover:border-white/20"
                aria-label="تسجيل الدخول - الإدارة"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
