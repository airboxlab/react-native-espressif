require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-espressif"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-espressif
                   DESC
  s.homepage     = "https://github.com/github_account/react-native-espressif"
  s.license      = "MIT"
  # s.license    = { :type => "MIT", :file => "FILE_LICENSE" }
  s.authors      = { "Julien Smolareck" => "julien.smolareck@gmail.com" }
  s.platform     = :ios, "9.0"
  s.source       = { :git => "https://github.com/github_account/react-native-espressif.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,swift}"
  s.requires_arc = true
  s.module_name  = 'RNEspressif'
  s.swift_version = '5.0'
  s.ios.deployment_target  = '9.0'
  # s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  s.dependency "React"
  s.dependency 'SwiftProtobuf', '~> 1.5.0'
  s.dependency 'Curve25519', '~> 1.1.0'
  # s.dependency "..."
end

