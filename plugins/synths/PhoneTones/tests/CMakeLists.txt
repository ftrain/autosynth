# Tests for PhoneTones

include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.4.0
)
FetchContent_MakeAvailable(Catch2)

add_executable(PhoneTones_Tests
    test_voice.cpp
)

target_link_libraries(PhoneTones_Tests PRIVATE
    Catch2::Catch2WithMain
    sst-libraries
)

target_include_directories(PhoneTones_Tests PRIVATE
    ${CMAKE_SOURCE_DIR}/source
    ${CMAKE_SOURCE_DIR}/source/dsp
)

include(CTest)
include(Catch)
catch_discover_tests(PhoneTones_Tests)
