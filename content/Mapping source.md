# Hướng dẫn mapping source code batch

## 7.1 Mapping file cấu hình

### Phương pháp chuyển đổi:

| Struts | Spring |
| --- | --- |
| application.properties | application.yml |
| 本番環境application.properties | application-production.yml |
| 検証環境(IT)application.properties | application-it.yml |
| 検証環境(ST)application.properties | application-st.yml |
| 検証環境(移行)application.properties | application-mock.yml|
| log4j.xml | logback-spring.xml |
| 本番環境log4j.xml | logback-spring-production.xml |
| 検証環境(IT)log4j.xml | logback-spring-it.xml |
| 検証環境(ST)log4j.xml | logback-spring-st.xml |
| 検証環境(移行)log4j.xml | logback-spring-mock.xml |
| MessageResources.properties | messages.properties |
| polestar.properties | 削除（application-default.ymlに統合） |
| 本番環境polestar.properties<br>検証環境(IT)polestar.properties<br>検証環境(ST)polestar.properties<br>検証環境(移行)polestar.properties | 削除（application-default.ymlに統合） |
#### Chi tiết cấu hình của application.yml:
- Cài đặt kết nối Database
- Cài đặt Logging
- Cài đặt Spring Security
- Các thuộc tính của Application
- Cài đặt MyBatis

**Lưu ý**

1. Sử dụng công cụ để chuyển đổi file `.properties` sang định dạng `.yml`.
2. Sau khi chuyển đổi bằng công cụ, so sánh file cũ và file mới để đảm bảo không có dữ liệu bị thiếu hoặc mất.


## 7.2 バッチロジックのマッピング

### 移行方法：

<table>
  <thead>
    <tr>
      <th>Struts</th>
      <th>Spring</th>
      <th>Ghi chú</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="5">{Batch ID}.java</td>
      <td>{Batch ID}Runner.java</td>
      <td>Điểm khởi động của batch job (tương đương với hàm main trong Struts)</td>
    </tr>
    <tr>
      <td>{Batch ID}Service.java</td>
      <td>Chứa business logic chính của batch (interface)</td>
    </tr>
    <tr>
      <td>{Batch ID}ServiceImpl.java</td>
      <td>Triển khai của Service</td>
    </tr>
    <tr>
      <td>{Batch ID}Mapper.java</td>
      <td>Định nghĩa các phương thức truy cập dữ liệu (interface)</td>
    </tr>
    <tr>
      <td>{Batch ID}Mapper.xml</td>
      <td>Lưu trữ các câu lệnh SQL tương ứng với Mapper.java</td>
    </tr>
  </tbody>
</table>

#### Quan hệ giữa các file trong Spring:
- Runner → Gọi Service → Gọi Mapper → Sử dụng Mapper.xml → Thực thi truy vấn vào Database

## 7.3 Mapping logic chung của batch

### Phương pháp chuyển đổi:

| Struts | Spring | Ghi chú |
| --- | --- | --- |
| AbstractBatchCommon.java | Định nghĩa phương pháp chuyển đổi cụ thể (không giữ nguyên, thích ứng với cấu trúc của Spring) | Chuyển đổi logic gốc để thích ứng với Spring. Cụ thể, chuyển DBUtil sang Mapper, xóa các phương thức `close` và `commit`, sử dụng Transaction và SQL Session. |
| AbstractFileGetBatchBase.java | Định nghĩa phương pháp chuyển đổi cụ thể (không giữ nguyên, sử dụng một phần) | Giữ logic gốc đồng thời thêm triển khai `FileGetBatchService`. |
| AbstractFileMakeBatchCommon.java | Định nghĩa phương pháp chuyển đổi cụ thể (không giữ nguyên, thích ứng với cấu trúc của Spring) | Giữ logic gốc. |
| AbstractLogBatch.java | Định nghĩa phương pháp chuyển đổi cụ thể (không giữ nguyên, thích ứng với cấu trúc của Spring) | Giữ logic gốc. |
| BatchConst.java | Giữ nguyên | - |
| BatchMsgConst.java | Giữ nguyên | - |

## 7.4 Mapping thư viện

### Phương pháp chuyển đổi:

| Struts | Spring |
| --- | --- |
| aopalliance-1.0.jar | Xóa (Sử dụng Spring Boot AOP) |
| asm-3.3.jar<br>asm-commons-3.3.jar<br>asm-tree-3.3.jar | Xóa (Không cần thiết trong Spring Boot) |
| cglib-nodep-2.2.jar | Xóa (Spring Boot sử dụng cơ chế proxy khác) |
| commons-codec-1.6.jar | Nâng cấp qua Maven dependency |
| commons-collections-3.2.2.jar | Thay thế bằng Java Collections Framework |
| commons-fileupload-1.3.3.jar | Nâng cấp qua Maven dependency (Sử dụng Spring MultipartFile) |
| commons-io-2.2.jar | Sử dụng Java NIO hoặc giữ nguyên |
| commons-lang3-3.1.jar | Nâng cấp qua Maven dependency |
| commons-logging-1.1.3.jar | Xóa (Thay thế bằng SLF4J/Logback) |
| freemarker-2.3.19.jar | Xóa (Thay thế bằng Thymeleaf) |
| javassist-3.11.0.GA.jar | Xóa (Không cần thiết trong Spring Boot) |
| log4j-1.2.17.jar | Xóa (Thay thế bằng spring-boot-starter-logging với logback-classic) |
| ognl-3.0.14-ysd-r002.jar | Xóa (Không cần thiết trong Spring Boot) |
| ojdbc8.jar | Nâng cấp lên ojdbc11.jar (phiên bản 23.5.0.24.07) |
| polestar2-2.2.0_12.jar | Xóa (Tái sử dụng hoặc viết lại các class) |
| spring-aop-3.0.5.RELEASE.jar<br>spring-beans-3.0.5.RELEASE.jar<br>spring-context-3.0.5.RELEASE.jar<br>spring-core-3.0.5.RELEASE.jar<br>spring-expression-3.0.5.RELEASE.jar | Tự động nâng cấp qua Spring Boot dependency (sử dụng spring-boot-starter) |
| spring-asm-3.0.5.RELEASE.jar | Xóa (Không cần thiết trong phiên bản mới của Spring) |
| struts2-core-2.3.16.1-ysd-r003.jar<br>struts2-json-plugin-2.3.16.1.jar<br>xwork-core-2.3.16.1.jar | Xóa (Thay thế hoàn toàn bằng Spring MVC với spring-boot-starter-web) |
| - | Thêm mới mybatis-spring-boot-starter |
| - | spring-boot-starter-* (Các module starter của Spring Boot) |

**Lưu ý**

  - Các file JAR trong thư mục `lib` của Struts được định nghĩa như dependency trong `pom.xml` của Spring.<br>
  Xem chi tiết tại liên kết sau:  
    [Google Spreadsheet Link](https://docs.google.com/spreadsheets/d/1a7UPawRjj52BflILnjDGv1JzITHzoyT8LRFGGZe9ee8/edit?gid=1342213983#gid=1342213983)

  - Đảm bảo các comment trong file POM tại liên kết sau đã được giải quyết:  
    [Google Spreadsheet Link](https://docs.google.com/spreadsheets/d/1uB8lltOfIWiEXdL5RkbxaOdTSaQjyeF8S7nJWW1Lzqw/edit?gid=565929852#gid=565929852&range=C274:C291)
