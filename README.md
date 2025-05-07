# Hướng dẫn Mapping source code chung

## 5.1 Mapping tệp cấu hình

### Phương pháp di chuyển:

| Struts                            | Spring                      |
|-----------------------------------|-----------------------------|
| CommonMessageResources.properties | Xóa                         |
| SystemCommon.properties           | SystemCommon.yml            |
| 本番環境SystemCommon.properties       | SystemCommon-production.yml |
| 検証環境(IT)SystemCommon.properties   | SystemCommon-it.yml         |
| 検証環境(ST)SystemCommon.properties   | SystemCommon-st.yml         |
| 検証環境(移行)SystemCommon.properties   | SystemCommon-mock.yml       |
| build.xml（Antビルド）                 | pom.xml（Mavenビルド）           |

**Lưu ý**

1. Sử dụng công cụ để chuyển đổi tệp `.properties` sang định dạng `.yml`.
2. Sau khi chuyển đổi bằng công cụ, so sánh tệp cũ và tệp mới để đảm bảo không có dữ liệu bị thiếu hoặc mất.
3. Đảm bảo rằng các nhận xét trong tệp POM đã được giải quyết, như được liệt kê trong liên kết sau:  
   [Google Spreadsheet Link](https://docs.google.com/spreadsheets/d/1uB8lltOfIWiEXdL5RkbxaOdTSaQjyeF8S7nJWW1Lzqw/edit?gid=565929852#gid=565929852&range=C274:C291)

## 5.2 Mapping logic chung

### Phương pháp di chuyển:

| Struts                       | Spring                                                                                                                                  |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| CommonUtil.java              | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived)                                                                   |
| ApplicationConfig.java       | ApplicationConfig.java (Spring @ConfigurationProperties)                                                                                |
| CommonMap.java               | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived)                                                                   |
| ContainerMap.java            | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo lại với cùng tên trong source Web và mở rộng từ HashMap      |
| GenericException.java        | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source batch và viết lại logic tương tự |
| GenericRuntimeException.java | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source batch và viết lại logic tương tự |
| IOSystemException.java       | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source batch và viết lại logic tương tự |
| AssertUtil.java              | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived)                                                                   |
| DownloadContext.java         | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source Web và viết lại logic tương tự   |
| TextUtil.java                | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên và viết lại logic tương tự                    |
| SecurityUtil.java            | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived)                                                                   |
| StringUtil.java              | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên và viết lại logic tương tự                    |
| StreamUtil.java              | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived)                                                                   |
| ValidatorUtil.java           | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source Web và viết lại logic tương tự   |
| URLEncoder.java              | Tương đương (Không sử dụng các class từ Polestar và Polestar-derived). Tạo class cùng tên trong source Web và viết lại logic tương tự   |
| {common}.java                | - {common}Util.java<br> - {common}Repository.java<br> - {common}RepositoryImpl.java<br> - {common}Mapper.java<br> - {common}Mapper.xml  |

## 5.3 Mapping thư viện (Library Mapping)

### Phương pháp di chuyển:

| Struts                              | Spring                                            |
|-------------------------------------|---------------------------------------------------|
| struts2-core-2.3.16.1-ysd-r003.jar  | Xóa (Thay thế bằng Spring MVC)                    |
| struts2-json-plugin-2.3.16.1.jar    | Xóa (Thay thế bằng Jackson tích hợp trong Spring) |
| xwork-core-2.3.16.1.jar             | Xóa (Phụ thuộc của Struts)                        |
| spring-aop-3.0.5.RELEASE.jar        | Tự động nâng cấp trong dependency của Spring Boot |
| spring-asm-3.0.5.RELEASE.jar        | Xóa (Tích hợp trong Spring Core)                  |
| spring-beans-3.0.5.RELEASE.jar      | Tự động nâng cấp trong dependency của Spring Boot |
| spring-context-3.0.5.RELEASE.jar    | Tự động nâng cấp trong dependency của Spring Boot |
| spring-core-3.0.5.RELEASE.jar       | Tự động nâng cấp trong dependency của Spring Boot |
| spring-expression-3.0.5.RELEASE.jar | Tự động nâng cấp trong dependency của Spring Boot |
| log4j-1.2.17.jar                    | Thay thế bằng logback (Mặc định của Spring Boot)  |
| commons-codec-1.6.jar               | Nâng cấp qua Maven dependency                     |
| commons-collections-3.2.2.jar       | Thay thế hoặc nâng cấp bằng Java Collections      |
| commons-fileupload-1.3.3.jar        | Thay thế bằng Spring MultipartFile                |
| commons-io-2.2.jar                  | Sử dụng Java NIO hoặc giữ nguyên                  |
| commons-lang3-3.1.jar               | Nâng cấp qua Maven dependency                     |
| ojdbc8.jar                          | Giữ nguyên (JDBC driver)                          |
| polestar2-2.2.0_12.jar              | Tái sử dụng hoặc viết lại các class               |
| dom4j-1.6.1.jar                     | Thay thế bằng JAXB hoặc giữ nguyên                |

**Lưu ý**

- Các tệp JAR trong thư mục `lib` của Struts cần được định nghĩa như dependency trong tệp `pom.xml` của Spring.<br>
  Chi tiết có thể tham khảo tại liên kết sau:  
  [Google Spreadsheet Link](https://docs.google.com/spreadsheets/d/1a7UPawRjj52BflILnjDGv1JzITHzoyT8LRFGGZe9ee8/edit?gid=1245446509#gid=1245446509)

## 5.4 Mapping xử lý đăng nhập

### Mapping xử lý đăng nhập (Login Process Mapping)

| Chức năng                          | Struts                                                                  | Spring                                                                                                                                                                                                                        |
|------------------------------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Framework cơ bản**               | Struts                                                                  | Spring Boot + Spring Security                                                                                                                                                                                                 |
| **Màn hình đăng nhập**             | LO01.jsp                                                                | LO01.html (Thymeleaf)                                                                                                                                                                                                         |
| **URL xử lý đăng nhập**            | `LO01Action_doLogin.action`                                             | `/LO01Action_doLogin.action`                                                                                                                                                                                                  |
| **Tên trường User ID**             | `txtUserId`                                                             | `txtUserId`                                                                                                                                                                                                                   |
| **Tên trường Password**            | `txtPassword`                                                           | `txtPassword`                                                                                                                                                                                                                 |
| **Class xử lý xác thực**           | `LO01Action` <br> `LO01Business`                                        | `LO01Controller` <br> `DaoAuthenticationProvider` <br>  `CustomPasswordEncoder (Cần tùy chỉnh vì không sử dụng hash password trong Eyoyaku)` <br>  `UserDetailsServiceImpl (implement UserDetailsService)`<br>  `LO01Service` |
| **Authentication Filter**          | -                                                                       | `UsernamePasswordAuthenticationFilter`                                                                                                                                                                                        |
| **Authentication Success Handler** | Thực hiện trong Action class                                            | `CustomAuthenticationSuccessHandler` (Tùy chỉnh dựa trên source code mẫu)                                                                                                                                                     |
| **Authentication Failure Handler** | Thực hiện trong Action class                                            | `CustomAuthenticationFailureHandler` (Tùy chỉnh dựa trên source code mẫu)                                                                                                                                                     |
| **Quản lý session**                | Lưu trong session                                                       | Quản lý bởi Spring Security                                                                                                                                                                                                   |
| **Xử lý logout**                   | Thực hiện trong CM01Action                                              | Logout filter của Spring Security và CM01Controller (Implement LogoutHandler)                                                                                                                                                 |
| **Xử lý session timeout**          | SessionTimeoutException trong EyoyakuWebExceptionHandleIntercepter.java | `invalidSessionStrategy` trong SecurityConfiguration                                                                                                                                                                          |
| **Hiển thị thông báo lỗi**         | `/WEB-INF/jsp/common/errors.jsp`                                        | `/templates/common/errors.html`                                                                                                                                                                                               |
| **Quản lý thông tin đăng nhập**    | `LoginInfoBean`                                                         | `LoginInfoBean (implement UserDetail)`                                                                                                                                                                                        |
