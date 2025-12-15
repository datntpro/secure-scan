'use client';

export function TestimonialsSection() {
  const testimonials = [
    {
      content: "Trước đây tôi không biết website có an toàn không. Giờ mỗi tháng tôi đều scan và yên tâm hơn nhiều. Báo cáo dễ hiểu, fix theo hướng dẫn là xong.",
      author: "Anh Minh",
      role: "Chủ shop Lazada",
      avatar: "👨‍💼",
    },
    {
      content: "Tool này giúp tôi báo cáo bảo mật cho sếp hàng tháng. Report chuyên nghiệp, có đủ thông tin cần thiết.",
      author: "Chị Hương",
      role: "IT Manager",
      avatar: "👩‍💻",
    },
    {
      content: "Giá rẻ mà chất lượng tốt. Tôi dùng cho tất cả dự án của clients. API dễ tích hợp, support nhiệt tình.",
      author: "Anh Tuấn",
      role: "Freelance Developer",
      avatar: "👨‍💻",
    },
  ];

  return (
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            💬 Khách hàng nói gì về chúng tôi?
          </h2>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <blockquote className="text-gray-900">
                  <p>"{testimonial.content}"</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                </figcaption>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}