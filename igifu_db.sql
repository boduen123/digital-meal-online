-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 29, 2025 at 07:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `igifu_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `meal_plans`
--

CREATE TABLE `meal_plans` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('Month','Half-month','Weekly') NOT NULL,
  `tier` enum('budget','basic','standard','premier','exclusive','vip') DEFAULT 'basic',
  `price` decimal(10,2) NOT NULL,
  `total_plates` int(11) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meal_plans`
--

INSERT INTO `meal_plans` (`id`, `restaurant_id`, `name`, `type`, `tier`, `price`, `total_plates`, `duration_days`, `is_active`) VALUES
(1, 5, 'boduen', 'Month', 'standard', 333.00, 2000, 2, 1),
(2, 13, 'fast foodsss', 'Month', 'basic', 30000.00, 60, 30, 0),
(3, 13, 'kwiyarurira fast', 'Month', 'basic', 300000.00, 60, 30, 0),
(4, 13, 'one', 'Month', 'basic', 30000.00, 60, 30, 0),
(5, 13, 'twoo', 'Month', 'basic', 30000.00, 60, 30, 0);

-- --------------------------------------------------------

--
-- Table structure for table `meal_usage_logs`
--

CREATE TABLE `meal_usage_logs` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `meal_index` int(11) DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `plates` int(11) DEFAULT 1,
  `status` enum('pending','approved','rejected','served') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `owner_user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `campus` varchar(100) DEFAULT NULL,
  `location_sector` varchar(100) DEFAULT NULL,
  `location_district` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Suspended') DEFAULT 'Pending',
  `rating` decimal(3,2) DEFAULT 4.50,
  `walk_time` varchar(20) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`id`, `owner_user_id`, `name`, `description`, `campus`, `location_sector`, `location_district`, `category`, `logo_url`, `image_url`, `status`, `rating`, `walk_time`, `contact_phone`, `contact_email`, `created_at`) VALUES
(3, 15, 'bonshop', 'mmmm', 'nyarugenge', 'nyarugenge', 'nyarugenge', 'gggg', 'kkk', 'jjjjjjj', 'Rejected', 4.50, '5min', '', 'jeanAIMEIRAGUHA@GMAIL.COM', '2025-12-09 14:07:03'),
(4, 18, 'kkk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Rejected', 4.50, NULL, NULL, 'kkkk@gmail.com', '2025-12-09 16:25:10'),
(5, 19, 'boo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Rejected', 4.50, NULL, NULL, 'niyonkuru@gmail.com', '2025-12-09 16:27:10'),
(13, 35, 'kamana restorent', 'kamana', 'huye campis', 'huye', 'huye', 'fast food sssss', 'blob:http://localhost:5173/7a47faba-ec15-4208-b954-5f0a7bb4cd17', 'https://www.google.com/search?q=campany+logo&rlz=1C1CHBF_enRW1149RW1149&oq=campany+logo&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTILCAEQABgKGAsYgAQyCwgCEAAYChgLGIAEMgsIAxAAGAoYCxiABDILCAQQABgKGAsYgAQyCwgFEAAYChgLGIAEMgsIBhAAGAoYCxiABDILCAcQABgKGAsYgAQyCwgIEAAYChgLGIA', 'Approved', 4.50, '5min', '0788089253', 'inkarestorent@gmail.com', '2025-12-29 12:06:31'),
(14, 36, 'agakuba restorent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Approved', 4.50, NULL, NULL, 'agakubarestorent@gmail.com', '2025-12-29 14:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `student_profiles`
--

CREATE TABLE `student_profiles` (
  `user_id` int(11) NOT NULL,
  `campus` varchar(100) DEFAULT NULL,
  `meal_wallet_balance` decimal(10,2) DEFAULT 0.00,
  `flexie_wallet_balance` decimal(10,2) DEFAULT 0.00,
  `card_locked` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_profiles`
--

INSERT INTO `student_profiles` (`user_id`, `campus`, `meal_wallet_balance`, `flexie_wallet_balance`, `card_locked`) VALUES
(12, NULL, 0.00, 0.00, 1),
(17, NULL, 0.00, 0.00, 1),
(21, NULL, 0.00, 0.00, 1),
(33, NULL, 0.00, 0.00, 1),
(34, NULL, 0.00, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `start_date` datetime DEFAULT current_timestamp(),
  `expiry_date` datetime NOT NULL,
  `total_plates` int(11) NOT NULL,
  `used_plates` int(11) DEFAULT 0,
  `price_paid` decimal(10,2) NOT NULL,
  `status` enum('Active','Expired','Depleted') DEFAULT 'Active',
  `payment_method` varchar(20) DEFAULT NULL,
  `payment_phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `student_id`, `plan_id`, `restaurant_id`, `start_date`, `expiry_date`, `total_plates`, `used_plates`, `price_paid`, `status`, `payment_method`, `payment_phone`) VALUES
(1, 11, 1, 5, '2025-12-16 18:34:19', '2025-12-10 18:34:19', 5, 2, 0.00, 'Expired', 'mtn', '0787890654');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('topup','subscription_payment','transfer','refund') NOT NULL,
  `method` varchar(50) DEFAULT NULL,
  `status` enum('completed','failed','pending') DEFAULT 'pending',
  `reference_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','restaurant','admin') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `phone`, `is_active`, `created_at`) VALUES
(11, 'admin', 'admin@igifu.com', '$2b$10$qxEyRrgmggOkpPsDPrUt7egQPHoNH9YY9YuPs1D536hUi06DBkuDe', 'admin', NULL, 1, '2025-12-09 13:57:51'),
(12, 'boduen', 'niyonkuruboduensun@gmail.com', '$2b$10$doZMjWyesbv3xj1fnUnAWeFcZaVuO0jrb8EXrBf1IDqzPIfHJUn.2', 'student', NULL, 1, '2025-12-09 13:59:34'),
(15, 'kevin', 'jeanAIMEIRAGUHA@GMAIL.COM', '$2b$10$tog7kZP8kLt7yPLYhBR1qeBeWZ4yTldo8/6R9cbwdIlcyTCSc/.O.', 'restaurant', '0792652471', 1, '2025-12-09 14:07:03'),
(17, 'alice', 'alice@gmail.com', '$2b$10$O4Dm4W3jIaRCM.r8vjHN1eGI9xs.eY6jpaazGlOTMw6xqOYtiAdk2', 'student', NULL, 1, '2025-12-09 16:08:11'),
(18, 'kkk', 'kkkk@gmail.com', '$2b$10$4.Mdh0Ck0Wyz4oaBE.e07.9jLVgqncfOPhrFilWvtNo1VbLjzxZM6', 'restaurant', '07899656', 1, '2025-12-09 16:25:10'),
(19, 'boo', 'niyonkuru@gmail.com', '$2b$10$qOKU9lEOVrFR/yk1iuRM1OsC6OxceP484tWZyM6dXV6xUiiNrDPIq', 'restaurant', '0998888', 1, '2025-12-09 16:27:10'),
(21, 'boduenk', 'pet@gmail.com', '$2b$10$m7O5UkMNz7sG2iXZ9XWoledZp0qzWgypx0.9VEv837f07Qya5qvim', 'student', NULL, 1, '2025-12-13 13:01:13'),
(22, 'bonshop', 'bonshop@gmail.com', '$2b$10$9.1dyrQqUzGNy4zCaQvWl.h5KvH7qWmwVZVU4dXHCtVvPzs.9XBs.', 'restaurant', '0792652470', 1, '2025-12-13 13:14:18'),
(23, 'kamanashop', 'kamanashop@gmail.com', '$2b$10$HsbqTk3JwNXb/RUTnVvUq..JHsvE9GssVeZlRMHPNZKD/jO8kPSsS', 'restaurant', NULL, 1, '2025-12-13 17:50:29'),
(26, 'kamana', 'kamanzi@gmail.com', '$2b$10$.H5d7E80WgwMO.9ra8yxNOeJy/A57./C1JHuS6znX5tZkKpFQl/Ke', 'restaurant', NULL, 1, '2025-12-13 17:58:49'),
(27, 'jackshop', 'jackshop@gmail.com', '$2b$10$PeKtsOaf.UZhHdL.8/N96Ov6k4bgbLAz5Vw07QR7j9pf0oxMatIMW', 'restaurant', '0792652470', 1, '2025-12-13 18:34:17'),
(28, 'kevinn', 'kevinn@gmail.com', '$2b$10$V.LNCg0JRZ2GEIhRe2XcVuYVZYObN7znYHjPXvp/5pzIWb0alGn1G', 'restaurant', '07888999', 1, '2025-12-13 19:19:42'),
(31, 'kammm', 'kammm@gmail.com', '$2b$10$gF9rH3AVx7sJVT4wQK3E0eGhdu56RNpdB0PMRIRGcEhuMbFfz4hha', 'restaurant', '0792652471', 1, '2025-12-13 19:50:23'),
(32, 'bodu', 'bodu@gmail.com', '$2b$10$NhRFLvZ7/jWVmyxrYE9rreV6DHBfE3inKxHQtJESvyl58qf9FSNFy', 'restaurant', '0788987645', 1, '2025-12-29 08:22:57'),
(33, 'jjjj', 'jjjj@gmail.com', '$2b$10$zZzON6AVzmPEKNP4bbMYUO66LuckmJPZSTe5cWPUhx31nHcgHu0Ca', 'student', NULL, 1, '2025-12-29 11:11:06'),
(34, 'kingbonheur', 'kingbonheur46@gmail.com', '$2b$10$c/8EQ6fWeu.AM9lpS0FWWeeLxrvGeIU4z8Xuc9YCwADvQIEPPf2XO', 'student', NULL, 1, '2025-12-29 11:19:28'),
(35, 'inkarestorent', 'inkarestorent@gmail.com', '$2b$10$N5m3bstP3i51XGw6cnF8OeYQWjaFHV.Sj.HRl19iKOh.hMZUt0WTy', 'restaurant', '0788725948', 1, '2025-12-29 12:06:31'),
(36, 'agakuba restorent', 'agakubarestorent@gmail.com', '$2b$10$PyYaaj6Dm9TKJx/5d.LQmO4yoUIeqg3UmyJln14K/8pfh337UxFY2', 'restaurant', '0788987645', 1, '2025-12-29 14:45:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `meal_plans`
--
ALTER TABLE `meal_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `meal_usage_logs`
--
ALTER TABLE `meal_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscription_id` (`subscription_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_user_id` (`owner_user_id`);

--
-- Indexes for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `meal_plans`
--
ALTER TABLE `meal_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `meal_usage_logs`
--
ALTER TABLE `meal_usage_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `meal_plans`
--
ALTER TABLE `meal_plans`
  ADD CONSTRAINT `meal_plans_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`);

--
-- Constraints for table `meal_usage_logs`
--
ALTER TABLE `meal_usage_logs`
  ADD CONSTRAINT `meal_usage_logs_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`),
  ADD CONSTRAINT `meal_usage_logs_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `meal_usage_logs_ibfk_3` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`);

--
-- Constraints for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `meal_plans` (`id`),
  ADD CONSTRAINT `subscriptions_ibfk_3` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
